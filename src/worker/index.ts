import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

// Type definitions for Cloudflare Bindings
export type Bindings = {
  DB: D1Database;
  SESSION_KV: KVNamespace;
  RESUME_BUCKET: R2Bucket;
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

// Mock Auth Routes for Milestone 1 (UI demonstration flow)
app.get('/api/auth/google/url', (c) => {
  // In a real app, this generates the Google OAuth URL.
  // For the vertical slice demo, we simulate redirecting to the callback.
  return c.redirect('/api/auth/google/callback?code=mock_auth_code');
});

app.get('/api/auth/google/callback', async (c) => {
  // In a real app, exchange code for token, upsert user in D1, create session in KV
  
  // For UI demo, redirect to onboarding directly
  // We assume a first-time user for the demo path.
  return c.redirect('/onboarding');
});

app.get('/api/auth/me', (c) => {
  return c.json({
    user: {
      id: 'mock_user_123',
      email: 'jane.doe@example.com',
      full_name: 'Jane Doe',
      role: 'candidate'
    }
  });
});

export default app;
