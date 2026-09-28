import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';

export type Bindings = {
  DB: D1Database;
  SESSION_KV: KVNamespace;
  ENVIRONMENT: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', logger());
app.use('*', cors());

// Basic health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', environment: c.env.ENVIRONMENT, timestamp: Date.now() });
});

// OAuth Constants
const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

// --- AUTHENTICATION ROUTES ---

// 1. Redirect to Google OAuth Consent Screen
app.get('/api/auth/google/url', async (c) => {
  const clientId = c.env.GOOGLE_CLIENT_ID;
  
  if (!clientId || clientId === 'MOCK_GOOGLE_CLIENT_ID') {
    console.warn("Using mock OAuth flow because GOOGLE_CLIENT_ID is not configured.");
    return c.redirect('/api/auth/google/callback?code=mock_auth_code');
  }

  // Ensure redirect URL correctly points to the Worker/Pages domain
  const url = new URL(c.req.url);
  const redirectUri = `${url.protocol}//${url.host}/api/auth/google/callback`;
  
  const state = crypto.randomUUID();
  
  setCookie(c, 'oauth_state', state, {
    path: '/',
    secure: c.env.ENVIRONMENT === 'production',
    httpOnly: true,
    maxAge: 60 * 10, // 10 minutes
    sameSite: 'Lax',
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: state,
    access_type: 'online',
    prompt: 'consent'
  });

  return c.redirect(`${GOOGLE_OAUTH_URL}?${params.toString()}`);
});

// 2. Handle Google OAuth Callback
app.get('/api/auth/google/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const storedState = getCookie(c, 'oauth_state');

  const clientId = c.env.GOOGLE_CLIENT_ID;
  const clientSecret = c.env.GOOGLE_CLIENT_SECRET;

  let userInfo: { id: string, email: string, name: string, picture?: string };

  // Handle Mock Flow if secrets are not yet available
  if (!clientId || clientId === 'MOCK_GOOGLE_CLIENT_ID' || code === 'mock_auth_code') {
     userInfo = {
       id: 'mock_google_id_123',
       email: 'jane.doe@example.com',
       name: 'Jane Doe',
       picture: ''
     };
  } else {
    // Verify state to prevent CSRF
    if (!state || state !== storedState) {
      return c.json({ error: 'Invalid state parameter' }, 400);
    }

    if (!code) {
      return c.json({ error: 'Authorization code missing' }, 400);
    }

    const url = new URL(c.req.url);
    const redirectUri = `${url.protocol}//${url.host}/api/auth/google/callback`;

    // Exchange code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange failed:', error);
      return c.json({ error: 'Failed to exchange authorization token' }, 400);
    }

    const tokenData = await tokenResponse.json<any>();

    // Fetch user info using the access token
    const userResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    if (!userResponse.ok) {
      return c.json({ error: 'Failed to fetch user info from Google' }, 400);
    }

    userInfo = await userResponse.json<any>();
  }

  const db = c.env.DB;
  
  // Check if user already exists
  const existingUser = await db.prepare('SELECT id, onboarding_completed FROM user_account WHERE email = ?')
    .bind(userInfo.email)
    .first<{ id: string, onboarding_completed: number }>();

  let finalUserId = existingUser?.id;
  let isNewUser = false;

  // Insert user if they don't exist
  if (!existingUser) {
    isNewUser = true;
    finalUserId = `usr_${crypto.randomUUID()}`;
    
    // Using org_default_public as the default sandbox organization (from schema.sql seed)
    await db.prepare(`
      INSERT INTO user_account (id, organization_id, email, full_name, avatar_url, role)
      VALUES (?, 'org_default_public', ?, ?, ?, 'candidate')
    `).bind(finalUserId, userInfo.email, userInfo.name, userInfo.picture || '').run();
  }

  // Create an application session
  const sessionId = crypto.randomUUID();
  await c.env.SESSION_KV.put(`session:${sessionId}`, JSON.stringify({
    userId: finalUserId,
    email: userInfo.email,
    role: 'candidate'
  }), { expirationTtl: 60 * 60 * 24 * 7 }); // 7 days

  // Set the session cookie
  setCookie(c, 'intellihire_session', sessionId, {
    path: '/',
    secure: c.env.ENVIRONMENT === 'production',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'Lax',
  });

  // Clear the OAuth state cookie
  deleteCookie(c, 'oauth_state');

  // Redirect based on onboarding status
  if (isNewUser || existingUser?.onboarding_completed === 0) {
    return c.redirect('/onboarding');
  }

  return c.redirect('/dashboard');
});

// 3. Get Current User (Session Validation)
app.get('/api/auth/me', async (c) => {
  const sessionId = getCookie(c, 'intellihire_session');
  if (!sessionId) return c.json({ user: null }, 401);

  const sessionDataStr = await c.env.SESSION_KV.get(`session:${sessionId}`);
  if (!sessionDataStr) {
    deleteCookie(c, 'intellihire_session'); // Invalid/expired session
    return c.json({ user: null }, 401);
  }

  const sessionData = JSON.parse(sessionDataStr);

  const user = await c.env.DB.prepare(
    'SELECT id, email, full_name, role, avatar_url, onboarding_completed FROM user_account WHERE id = ?'
  ).bind(sessionData.userId).first();

  if (!user) return c.json({ user: null }, 401);

  return c.json({ user });
});

// 4. Logout
app.post('/api/auth/logout', async (c) => {
  const sessionId = getCookie(c, 'intellihire_session');
  if (sessionId) {
    await c.env.SESSION_KV.delete(`session:${sessionId}`);
    deleteCookie(c, 'intellihire_session');
  }
  return c.json({ success: true });
});

export default app;
