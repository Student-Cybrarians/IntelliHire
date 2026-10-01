import { describe, it, expect, vi } from 'vitest';
import { vi } from 'vitest';
vi.mock('hono/jwt', () => ({
  sign: vi.fn().mockResolvedValue('fake-jwt'),
  verify: vi.fn().mockResolvedValue({ id: 'user-1', role: 'recruiter' }),
}));

import { app } from '../functions/api/[[route]]';

describe('AI Validation: JD Extraction', () => {
  it('validates JD text length', async () => {
    const env = { SESSION_KV: { get: vi.fn().mockResolvedValue('valid-jwt') } };
    const req = new Request('http://localhost/api/jd/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': 'intellihire_session=token' },
      body: JSON.stringify({ jd_text: 'too short' })
    });
    const res = await app.request(req, {}, env);
    expect(res.status).toBe(400); // Because it should reject short JDs
  });
});
