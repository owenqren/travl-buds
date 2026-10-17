// vitest helpers and the module under test.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authFetch, getAuthToken } from './authFetch';

// Fake fetch responses: a success and an expired-session 401.
const okResponse = { ok: true, status: 200, json: async () => ({}) };
const unauthorizedResponse = { ok: false, status: 401, json: async () => ({}) };

describe('authFetch', () => {
    // Before each test: empty storage, a fake API URL, a mocked global fetch, and a writable window.location.
    beforeEach(() => {
        localStorage.clear();
        vi.stubEnv('VITE_API_URL', 'https://api.test');
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse));
        Object.defineProperty(window, 'location', {
            writable: true,
            value: { href: '' },
        });
    });

    // After each test: undo the env and global stubs.
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
    });

    // Relative paths are prefixed with VITE_API_URL.
    it('prefixes relative paths with VITE_API_URL', async () => {
        await authFetch('/api/trips');

        expect(fetch).toHaveBeenCalledWith('https://api.test/api/trips', expect.any(Object));
    });

    // Absolute URLs are passed through as-is.
    it('leaves absolute URLs untouched', async () => {
        await authFetch('https://other.example.com/thing');

        expect(fetch).toHaveBeenCalledWith('https://other.example.com/thing', expect.any(Object));
    });

    // A stored token becomes a Bearer header.
    it('adds the bearer token when one is stored', async () => {
        localStorage.setItem('travlbudsToken', 'abc123');

        await authFetch('/api/trips');

        const [, init] = fetch.mock.calls[0];
        expect(init.headers.Authorization).toBe('Bearer abc123');
    });

    // No token means no Authorization header.
    it('omits the Authorization header when there is no token', async () => {
        await authFetch('/api/trips');

        const [, init] = fetch.mock.calls[0];
        expect(init.headers.Authorization).toBeUndefined();
    });

    // Content-Type is set only for requests that have a body.
    it('sets Content-Type only when a body is present', async () => {
        await authFetch('/api/trips', { method: 'POST', body: '{}' });

        const [, withBody] = fetch.mock.calls[0];
        expect(withBody.headers['Content-Type']).toBe('application/json');

        fetch.mockClear();
        await authFetch('/api/trips');

        const [, withoutBody] = fetch.mock.calls[0];
        expect(withoutBody.headers['Content-Type']).toBeUndefined();
    });

    // A 401 wipes the saved session and redirects to the landing page.
    it('clears stored auth and redirects to / on a 401', async () => {
        localStorage.setItem('travlbudsToken', 'abc123');
        localStorage.setItem('travlbudsUser', '{"id":1}');
        fetch.mockResolvedValue(unauthorizedResponse);

        await authFetch('/api/trips');

        expect(localStorage.getItem('travlbudsToken')).toBeNull();
        expect(localStorage.getItem('travlbudsUser')).toBeNull();
        expect(window.location.href).toBe('/');
    });

    // Other statuses leave storage and location alone.
    it('does not touch storage on a non-401 response', async () => {
        localStorage.setItem('travlbudsToken', 'abc123');

        await authFetch('/api/trips');

        expect(localStorage.getItem('travlbudsToken')).toBe('abc123');
        expect(window.location.href).toBe('');
    });

    // getAuthToken returns whatever is stored under travlbudsToken.
    it('getAuthToken reads the stored token', () => {
        localStorage.setItem('travlbudsToken', 'xyz');

        expect(getAuthToken()).toBe('xyz');
    });
});
