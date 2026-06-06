export function getAuthToken() {
    return localStorage.getItem('travlbudsToken');
}

export async function authFetch(path, options = {}) {
    const token = getAuthToken();
    const url = path.startsWith('http')
        ? path
        : `${import.meta.env.VITE_API_URL}${path}`;

    const headers = {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        localStorage.removeItem('travlbudsToken');
        localStorage.removeItem('travlbudsUser');
        window.location.href = '/';
    }

    return response;
}