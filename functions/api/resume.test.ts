/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { app } from './[[route]]';

vi.mock('hono/jwt', () => ({
  sign: vi.fn().mockResolvedValue('fake-jwt'),
  verify: vi.fn().mockResolvedValue({ id: 'user-1' }),
}));

// Provide a full mock DB setup
const createMockEnv = (dbOverrides: any = {}) => ({
  DB: {
    prepare: vi.fn().mockImplementation((query) => {
      return {
        bind: vi.fn().mockImplementation((...args) => {
          return {
            first: vi.fn().mockResolvedValue(dbOverrides.first || { organization_id: 'org-1', max_v: 0 }),
            run: vi.fn().mockResolvedValue(true),
          };
        })
      };
    }),
  },
  SESSION_KV: { get: vi.fn().mockResolvedValue('fake-jwt') },
  RESUME_KV: { put: vi.fn().mockResolvedValue(true) },
  JWT_SECRET: 'test-secret',
});

describe('Hardened Resume API', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('1. File Validation: reject spoofed .exe renamed to .pdf (Magic Bytes)', async () => {
    const env = createMockEnv();
    
    // Create an invalid PDF (e.g. an MZ header for an exe, or just zeroes)
    const spoofedContent = new Uint8Array([0x4D, 0x5A, 0x90, 0x00, 0x03]); // Not %PDF-
    const file = new File([spoofedContent], 'spoofed.pdf', { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('file', file);

    const req = new Request('http://localhost/api/resume/upload', {
      method: 'POST',
      body: formData,
      headers: { Cookie: 'intellihire_session=session-1' },
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(400);
    const data = await res.json() as any;
    expect(data.error).toContain('Magic byte signature mismatch');
  });

  it('2. File Validation: accept valid PDF magic bytes', async () => {
    const env = createMockEnv();
    
    // %PDF-
    const validContent = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x00]); 
    const file = new File([validContent], 'valid.pdf', { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('file', file);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ text: 'text', status: 'SUCCESS', metadata: {} }),
    });

    const req = new Request('http://localhost/api/resume/upload', {
      method: 'POST',
      body: formData,
      headers: { Cookie: 'intellihire_session=session-1' },
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
  });

  it('3. File Validation: accept valid DOCX magic bytes (PK)', async () => {
    const env = createMockEnv();
    // PK\x03\x04
    const validContent = new Uint8Array([0x50, 0x4B, 0x03, 0x04, 0x00]); 
    const file = new File([validContent], 'valid.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const formData = new FormData();
    formData.append('file', file);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ text: 'text', status: 'SUCCESS', metadata: {} }),
    });

    const req = new Request('http://localhost/api/resume/upload', {
      method: 'POST',
      body: formData,
      headers: { Cookie: 'intellihire_session=session-1' },
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
  });

  it('4. Versioning: increments version based on DB', async () => {
    const env = createMockEnv({ first: { organization_id: 'org-1', max_v: 4 } });
    
    const validContent = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x01]); 
    const file = new File([validContent], 'resume.pdf');
    const formData = new FormData();
    formData.append('file', file);

    mockFetch.mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({}) });

    const req = new Request('http://localhost/api/resume/upload', {
      method: 'POST',
      body: formData,
      headers: { Cookie: 'intellihire_session=session-1' },
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.version).toBe(5); // 4 + 1
  });

  it('5. Tenant Isolation: GET /resume/latest returns only scoped resume', async () => {
    const env = createMockEnv({ first: { id: 'resume-1', filename: 'mine.pdf', file_format: 'pdf', version: 1 } });
    const req = new Request('http://localhost/api/resume/latest', { headers: { Cookie: 'intellihire_session=session-1' } });
    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.resume.filename).toBe('mine.pdf');
  });

  it('6. Tenant Isolation: unauthenticated blocked', async () => {
    const env = createMockEnv();
    env.SESSION_KV.get = vi.fn().mockResolvedValue(null);
    const req = new Request('http://localhost/api/resume/latest');
    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(401);
  });

  it('7. Failure Mode: python extractor 500 returns clean error', async () => {
    const env = createMockEnv();
    const validContent = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x01]); 
    const file = new File([validContent], 'resume.pdf');
    const formData = new FormData();
    formData.append('file', file);

    mockFetch.mockResolvedValueOnce({ ok: false, json: vi.fn().mockResolvedValue({ error: 'Archive bomb detected' }) });

    const req = new Request('http://localhost/api/resume/upload', {
      method: 'POST', body: formData, headers: { Cookie: 'intellihire_session=session-1' },
    });

    const res = await app.request(req, {}, env as any);
    expect(res.status).toBe(400);
    const data = await res.json() as any;
    expect(data.error).toBe('Archive bomb detected');
  });
});
