// Reads the JWT that App.jsx's handleLogin stored under 'travlbudsToken' (null when logged out).
export function getAuthToken() {
    return localStorage.getItem('travlbudsToken');
}

// fetch wrapper for every authenticated API call; depends on VITE_API_URL and the stored token.
export async function authFetch(path, options = {}) {
    const token = getAuthToken();
    // Relative paths get the backend base URL; absolute URLs pass through untouched.
    const url = path.startsWith('http')
        ? path
        : `${import.meta.env.VITE_API_URL}${path}`;

    // Merge headers: JSON content type only when there is a body, caller headers, then the Bearer token if logged in.
    const headers = {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    // Perform the request with the merged options.
    const response = await fetch(url, {
        ...options,
        headers,
    });

    // On 401 (expired/invalid JWT) clear the saved session and send the user back to the landing page.
    if (response.status === 401) {
        localStorage.removeItem('travlbudsToken');
        localStorage.removeItem('travlbudsUser');
        window.location.href = '/';
    }

    return response;
}
