import { describe, it, expect, vi } from 'vitest';
import { app } from './[[route]]';

vi.mock('hono/jwt', () => ({
  sign: vi.fn().mockResolvedValue('fake-jwt'),
  verify: vi.fn().mockResolvedValue({ id: 'user-1' }),
}));

describe('Profile API', () => {
  it('should return 401 for unauthorized access to GET /api/profile', async () => {
    const env = {
      DB: {},
      SESSION_KV: {
        get: vi.fn().mockResolvedValue(null),
      },
      JWT_SECRET: 'test-secret',
    };

    const res = await app.request('/api/profile', {}, env);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data).toEqual({ error: 'Unauthorized' });
  });

  it('should return profile for authorized user', async () => {
    const jwt = 'fake-jwt';
    
    const env = {
      DB: {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue({ id: 'profile-1', user_id: 'user-1', bio: 'Hello' }),
          }),
        }),
      },
      SESSION_KV: {
        get: vi.fn().mockResolvedValue(jwt),
      },
      JWT_SECRET: 'test-secret',
    };

    const req = new Request('http://localhost/api/profile', {
      headers: {
        Cookie: 'intellihire_session=session-1',
      },
    });

    const res = await app.request(req, {}, env);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.profile.bio).toBe('Hello');
  });
});
