const BASE_URL = '/api';

function getToken() {
    return localStorage.getItem('token');
}

export function setAuth(data) {
    if (data.token) localStorage.setItem('token', data.token);
    if (data.userId) localStorage.setItem('userId', data.userId);
    if (data.name) localStorage.setItem('name', data.name);
    if (data.email) localStorage.setItem('email', data.email);
}

export function clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('name');
    localStorage.removeItem('email');
}

export function isAuthenticated() {
    return !!getToken();
}

export function getUser() {
    return {
        id: localStorage.getItem('userId'),
        name: localStorage.getItem('name'),
        email: localStorage.getItem('email')
    };
}

export async function fetchApi(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const isFormData = options.body instanceof FormData;

    const headers = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
    };

    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = { ...options, headers };

    let response;
    try {
        response = await fetch(url, config);
    } catch (networkErr) {
        throw new Error('Could not reach the server. Check your connection and try again.');
    }

    let data = {};
    try {
        data = await response.json();
    } catch (_) { /* empty body */ }

    if (response.status === 401 && endpoint !== '/auth/login') {
        clearAuth();
        window.location.href = '/';
        throw new Error('Session expired. Please sign in again.');
    }

    if (!response.ok) {
        throw new Error(data.message || 'Something went wrong. Please try again.');
    }

    return data;
}

export const api = {
    get: (endpoint) => fetchApi(endpoint, { method: 'GET' }),
    post: (endpoint, body) => fetchApi(endpoint, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
    put: (endpoint, body) => fetchApi(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (endpoint) => fetchApi(endpoint, { method: 'DELETE' })
};
