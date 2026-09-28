import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { sign, verify } from 'hono/jwt';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';

type Bindings = {
  DB: D1Database;
  SESSION_KV: KVNamespace;
  ENVIRONMENT: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  JWT_SECRET: string;
};

type UserSession = {
  id: string;
  email: string;
  full_name: string;
  role: string;
};

export const app = new Hono<{ Bindings: Bindings }>().basePath('/api');

app.get('/health', (c) => c.json({ status: 'ok', time: Date.now() }));

// 1. Initiate Google OAuth Flow
app.get('/auth/google/url', async (c) => {
  const clientId = c.env.GOOGLE_CLIENT_ID;
  if (!clientId || clientId === 'MOCK_GOOGLE_CLIENT_ID') {
    return c.json({ error: 'Google OAuth is not configured on the server yet.' }, 500);
  }

  const redirectUri = `${new URL(c.req.url).origin}/api/auth/google/callback`;
  const state = crypto.randomUUID();
  
  // Store state in KV with a 10 min expiration to prevent CSRF
  await c.env.SESSION_KV.put(`oauth_state:${state}`, 'valid', { expirationTtl: 600 });

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('access_type', 'online');
  authUrl.searchParams.set('prompt', 'select_account');

  return c.redirect(authUrl.toString());
});

// 2. Google OAuth Callback
app.get('/auth/google/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  
  if (!code || !state) {
    return c.text('Missing code or state', 400);
  }

  // Verify state
  const validState = await c.env.SESSION_KV.get(`oauth_state:${state}`);
  if (!validState) {
    return c.text('Invalid or expired state parameter', 400);
  }
  await c.env.SESSION_KV.delete(`oauth_state:${state}`);

  const clientId = c.env.GOOGLE_CLIENT_ID;
  const clientSecret = c.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${new URL(c.req.url).origin}/api/auth/google/callback`;

  // Exchange code for token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    })
  });

  const tokenData = await tokenResponse.json() as any;
  if (tokenData.error) {
    return c.text(`Token exchange failed: ${tokenData.error_description}`, 400);
  }

  // Fetch user profile
  const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  });
  
  const userData = await userResponse.json() as any;
  if (!userData.email) {
    return c.text('Failed to fetch user profile', 400);
  }

  // Database Upsert (Simplified for Milestone 1)
  // 1. Ensure public organization exists
  await c.env.DB.prepare(`
    INSERT OR IGNORE INTO organization (id, name, slug, tier)
    VALUES ('org_default_public', 'IntelliHire Public Sandbox', 'public-sandbox', 'free')
  `).run();

  // 2. Check if user exists
  const existingUser = await c.env.DB.prepare('SELECT * FROM user_account WHERE email = ?')
    .bind(userData.email)
    .first();

  let userId = existingUser?.id as string;
  let isNewUser = false;

  if (!existingUser) {
    userId = crypto.randomUUID();
    isNewUser = true;
    await c.env.DB.prepare(`
      INSERT INTO user_account (id, organization_id, email, full_name, avatar_url, role)
      VALUES (?, 'org_default_public', ?, ?, ?, 'candidate')
    `).bind(userId, userData.email, userData.name, userData.picture).run();
  } else {
    await c.env.DB.prepare('UPDATE user_account SET last_login_at = unixepoch() WHERE id = ?')
      .bind(userId).run();
  }

  // Create Session JWT
  const sessionData: UserSession = {
    id: userId,
    email: userData.email,
    full_name: userData.name,
    role: (existingUser?.role as string) || 'candidate'
  };

  const sessionId = crypto.randomUUID();
  const jwt = await sign(sessionData, c.env.JWT_SECRET);
  
  // Store in KV (24 hours)
  await c.env.SESSION_KV.put(`session:${sessionId}`, jwt, { expirationTtl: 86400 });

  // Set Cookie
  setCookie(c, 'intellihire_session', sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: 86400
  });

  // Redirect based on whether it's a new user
  if (isNewUser || !(existingUser?.onboarding_completed)) {
    return c.redirect('/onboarding');
  } else {
    return c.redirect('/dashboard');
  }
});

// 3. Get Current Session
app.get('/auth/me', async (c) => {
  const sessionId = getCookie(c, 'intellihire_session');
  if (!sessionId) return c.json({ user: null }, 401);

  const jwt = await c.env.SESSION_KV.get(`session:${sessionId}`);
  if (!jwt) return c.json({ user: null }, 401);

  try {
    const payload = await verify(jwt, c.env.JWT_SECRET);
    return c.json({ user: payload });
  } catch (e) {
    return c.json({ user: null }, 401);
  }
});

// 4. Logout
app.post('/auth/logout', async (c) => {
  const sessionId = getCookie(c, 'intellihire_session');
  if (sessionId) {
    await c.env.SESSION_KV.delete(`session:${sessionId}`);
    deleteCookie(c, 'intellihire_session', { path: '/' });
  }
  return c.json({ success: true });
});

// Helper for session validation
const getSessionUser = async (c: any): Promise<UserSession | null> => {
  const sessionId = getCookie(c, 'intellihire_session');
  if (!sessionId) return null;
  const jwt = await c.env.SESSION_KV.get(`session:${sessionId}`);
  if (!jwt) return null;
  try {
    return (await verify(jwt, c.env.JWT_SECRET)) as UserSession;
  } catch {
    return null;
  }
};

// 5. Get Candidate Profile
app.get('/profile', async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const profile = await c.env.DB.prepare('SELECT * FROM candidate_profile WHERE user_id = ?').bind(user.id).first();
  return c.json({ profile });
});

// 6. Update Candidate Profile
app.put('/profile', async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  const { target_role, experience_level, bio } = body;

  const dbUser = await c.env.DB.prepare('SELECT organization_id FROM user_account WHERE id = ?').bind(user.id).first();
  if (!dbUser) return c.json({ error: 'User not found' }, 404);

  const orgId = dbUser.organization_id;

  const existingProfile = await c.env.DB.prepare('SELECT id FROM candidate_profile WHERE user_id = ?').bind(user.id).first();

  if (existingProfile) {
    await c.env.DB.prepare('UPDATE candidate_profile SET target_role = ?, experience_level = ?, bio = ?, updated_at = unixepoch() WHERE user_id = ?')
      .bind(target_role || null, experience_level || null, bio || null, user.id).run();
  } else {
    await c.env.DB.prepare('INSERT INTO candidate_profile (id, organization_id, user_id, target_role, experience_level, bio) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), orgId, user.id, target_role || null, experience_level || null, bio || null).run();
  }

  await c.env.DB.prepare('UPDATE user_account SET onboarding_completed = 1 WHERE id = ?').bind(user.id).run();

  return c.json({ success: true, profile: body });
});

export const onRequest = handle(app);
