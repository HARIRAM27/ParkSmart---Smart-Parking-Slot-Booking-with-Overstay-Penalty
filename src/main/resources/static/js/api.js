/* ============================================================
   ParkSmart – API Helper (api.js)
   All HTTP requests go through apiRequest().
   ============================================================ */

const API_BASE = '';

/** Retrieve the JWT token from localStorage */
function getToken() {
    return localStorage.getItem('token');
}

/** Retrieve the logged-in user object from localStorage */
function getUser() {
    try {
        return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
        return {};
    }
}

/**
 * Central fetch wrapper with JWT injection and error handling.
 * @param {string} method  - HTTP method
 * @param {string} path    - API path (e.g. '/api/lots')
 * @param {object} [body]  - Request body (will be JSON-serialised)
 * @returns {Promise<any>}
 */
async function apiRequest(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const options = { method, headers };
    if (body !== undefined) options.body = JSON.stringify(body);

    let res;
    try {
        res = await fetch(API_BASE + path, options);
    } catch (networkErr) {
        throw new Error('Network error – is the server running?');
    }

    if (res.status === 401) {
        localStorage.clear();
        window.location.href = '/login.html';
        return;
    }

    if (!res.ok) {
        let errMsg = 'Request failed: ' + res.status;
        try {
            const errBody = await res.json();
            errMsg = errBody.message || errBody.error || errMsg;
        } catch { /* ignore parse errors */ }
        throw new Error(errMsg);
    }

    if (res.status === 204) return null;
    
    // Some DELETE endpoints return plain text
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        return res.json();
    }
    return res.text();
}

/** Convenience API object */
const api = {
    get:    (path)        => apiRequest('GET',    path),
    post:   (path, body)  => apiRequest('POST',   path, body),
    put:    (path, body)  => apiRequest('PUT',    path, body),
    patch:  (path, body)  => apiRequest('PATCH',  path, body),
    delete: (path)        => apiRequest('DELETE', path),
};
