import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, DEFAULT_API_URL } from '../axiosClient';

describe('axiosClient', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('creates an axios instance pointing at the backend API by default', () => {
    expect(typeof api.request).toBe('function');
    expect(api.defaults.baseURL).toBe(DEFAULT_API_URL);
  });

  it('uses VITE_API_URL when defined and strips trailing slashes', async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:9999/api/');
    vi.resetModules();

    const { api: customApi } = await import('../axiosClient');

    expect(customApi.defaults.baseURL).toBe('http://localhost:9999/api');
  });
});