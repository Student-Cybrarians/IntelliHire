/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { app } from './[[route]]';

vi.mock('hono/jwt', () => ({
  sign: vi.fn().mockResolvedValue('fake-jwt'),
  verify: vi.fn().mockResolvedValue({ id: 'user-1' }),
}));

describe('Resume API', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('should return 401 for unauthorized access to POST /api/resume/upload', async () => {
    const env = {
      SESSION_KV: {
        get: vi.fn().mockResolvedValue(null),
      },
      JWT_SECRET: 'test-secret',
    };

    const req = new Request('http://localhost/api/resume/upload', {
      method: 'POST',
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(401);
  });

  it('should return 400 for invalid file extension', async () => {
    const env = {
      SESSION_KV: {
        get: vi.fn().mockResolvedValue('fake-jwt'),
      },
      JWT_SECRET: 'test-secret',
    };

    const formData = new FormData();
    const file = new File(['dummy content'], 'test.exe', { type: 'application/x-msdownload' });
    formData.append('file', file);

    const req = new Request('http://localhost/api/resume/upload', {
      method: 'POST',
      body: formData,
      headers: {
        Cookie: 'intellihire_session=session-1',
      },
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(400);
    const data = await res.json() as any;
    expect(data.error).toContain('Invalid file format');
  });

  it('should return 400 for oversized file', async () => {
    const env = {
      SESSION_KV: {
        get: vi.fn().mockResolvedValue('fake-jwt'),
      },
      JWT_SECRET: 'test-secret',
    };

    const largeArray = new Uint8Array(6 * 1024 * 1024);
    const file = new File([largeArray], 'test.pdf', { type: 'application/pdf' });

    const formData = new FormData();
    formData.append('file', file);

    const req = new Request('http://localhost/api/resume/upload', {
      method: 'POST',
      body: formData,
      headers: {
        Cookie: 'intellihire_session=session-1',
      },
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(400);
    const data = await res.json() as any;
    expect(data.error).toContain('File size exceeds');
  });

  it('should successfully upload a valid file', async () => {
    const env = {
      DB: {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue({ organization_id: 'org-1' }),
            run: vi.fn().mockResolvedValue(true),
          }),
        }),
      },
      SESSION_KV: {
        get: vi.fn().mockResolvedValue('fake-jwt'),
      },
      RESUME_KV: {
        put: vi.fn().mockResolvedValue(true),
      },
      JWT_SECRET: 'test-secret',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ text: 'dummy resume text', skills: ['TypeScript'] }),
    });

    const file = new File(['dummy content'], 'dummy.txt', { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', file);

    const req = new Request('http://localhost/api/resume/upload', {
      method: 'POST',
      body: formData,
      headers: {
        Cookie: 'intellihire_session=session-1',
      },
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.extracted.text).toBe('dummy resume text');
  });
});
