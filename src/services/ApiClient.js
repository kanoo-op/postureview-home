// ApiClient.js - JWT 인증 + 서버 API 통신

const API_BASE = '/api';  // vite proxy로 백엔드 연결

const TOKEN_KEY = 'pvh_access_token';
const REFRESH_KEY = 'pvh_refresh_token';
const USER_KEY = 'pvh_user';

// ═══ Token Management ═══

export function getAccessToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken() {
    return localStorage.getItem(REFRESH_KEY);
}

export function getUser() {
    try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

export function isLoggedIn() {
    return !!getAccessToken();
}

function saveTokens(access, refresh, user) {
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearTokens() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
}

// ═══ API Fetch (with auto-refresh) ═══

let refreshPromise = null;

export async function apiFetch(path, options = {}) {
    const token = getAccessToken();
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let resp = await fetch(`${API_BASE}${path}`, { ...options, headers });

    // 401 → try refresh
    if (resp.status === 401 && getRefreshToken()) {
        const refreshed = await tryRefresh();
        if (refreshed) {
            headers['Authorization'] = `Bearer ${getAccessToken()}`;
            resp = await fetch(`${API_BASE}${path}`, { ...options, headers });
        } else {
            clearTokens();
            window.dispatchEvent(new CustomEvent('pvh:logout'));
            throw new Error('Session expired');
        }
    }

    if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.detail || `API error ${resp.status}`);
    }

    return resp.json();
}

async function tryRefresh() {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        try {
            const resp = await fetch(`${API_BASE}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: getRefreshToken() }),
            });
            if (!resp.ok) return false;

            const data = await resp.json();
            saveTokens(data.access_token, data.refresh_token, data.user);
            return true;
        } catch {
            return false;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

// ═══ Auth Actions ═══

export async function validateInviteCode(code) {
    const resp = await fetch(`${API_BASE}/portal/auth/validate-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_code: code }),
    });
    return resp.json();
}

export async function registerWithInvite(inviteCode, username, password, fullName) {
    const resp = await fetch(`${API_BASE}/portal/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            invite_code: inviteCode,
            username,
            password,
            full_name: fullName,
        }),
    });

    if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.detail || 'Registration failed');
    }

    const data = await resp.json();
    saveTokens(data.access_token, data.refresh_token, data.user);
    return data;
}

export async function login(username, password) {
    const resp = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.detail || 'Login failed');
    }

    const data = await resp.json();
    saveTokens(data.access_token, data.refresh_token, data.user);
    return data;
}

export function logout() {
    const token = getAccessToken();
    if (token) {
        // Best-effort server logout
        fetch(`${API_BASE}/auth/logout`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        }).catch(() => {});
    }
    clearTokens();
    window.dispatchEvent(new CustomEvent('pvh:logout'));
}
