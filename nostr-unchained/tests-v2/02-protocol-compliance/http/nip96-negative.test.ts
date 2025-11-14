import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';
import { Nip96Client } from '../../../src/http/Nip96Client.js';

type ServerMode = 'invalid-json' | 'upload-error';

describe('NIP-96 Client – negative scenarios', () => {
  let server: ReturnType<typeof createServer>;
  let baseUrl: string;
  let mode: ServerMode = 'invalid-json';

  beforeAll(async () => {
    server = await new Promise<ReturnType<typeof createServer>>((resolve) => {
      const s = createServer((req, res) => {
        if (req.url?.startsWith('/.well-known/nostr/nip96.json')) {
          if (mode === 'invalid-json') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({}));
            return;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ api_url: `${baseUrl}/upload` }));
          return;
        }

        if (req.url === '/upload' && req.method === 'POST') {
          if (mode === 'upload-error') {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'error', message: 'upload failed' }));
            return;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'success', message: 'ok' }));
          return;
        }

        res.writeHead(404).end();
      }).listen(0, () => resolve(s));
    });

    const port = (server.address() as any).port;
    baseUrl = `http://127.0.0.1:${port}`;
  }, 10000);

  afterAll(() => {
    server?.close();
  });

  it('throws when nip96.json is missing the api_url field', async () => {
    mode = 'invalid-json';
    const client = new Nip96Client({});
    await expect(client.discover(baseUrl)).rejects.toThrow(/Invalid nip96\.json/i);
  });

  it('returns error status when upload endpoint fails', async () => {
    mode = 'upload-error';
    const client = new Nip96Client({});
    const payload = new TextEncoder().encode('test-bytes');

    const result = await client.upload(baseUrl, payload, { filename: 'file.bin', requireAuth: false });
    expect(result.status).toBe('error');
    expect(result.message).toBe('upload failed');
  });
});

