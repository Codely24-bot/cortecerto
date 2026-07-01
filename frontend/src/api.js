const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const SESSION_STORAGE_KEY = "admin_session";
const LEGACY_TOKEN_STORAGE_KEY = "admin_token";

function normalizeBaseUrl(value) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function getBrowserHostname() {
  return typeof window === "undefined" ? "" : window.location.hostname;
}

function getBrowserOrigin() {
  return typeof window === "undefined" ? "http://localhost" : window.location.origin;
}

function isLoopbackHost(hostname) {
  return LOOPBACK_HOSTS.has(hostname);
}

function isLoopbackUrl(value) {
  if (!value) {
    return false;
  }

  try {
    const parsed = new URL(value, getBrowserOrigin());
    return isLoopbackHost(parsed.hostname);
  } catch (error) {
    return false;
  }
}

function shouldIgnoreLoopbackUrl(value) {
  const currentHostname = getBrowserHostname();
  return !isLoopbackHost(currentHostname) && isLoopbackUrl(value);
}

function resolveApiUrl() {
  const rawApiUrl = normalizeBaseUrl((import.meta.env.VITE_API_URL || "").trim());

  if (!rawApiUrl || shouldIgnoreLoopbackUrl(rawApiUrl)) {
    return "/api";
  }

  return rawApiUrl;
}

export const API_URL = resolveApiUrl();

export function resolveChatbotQrUrl() {
  const rawChatbotUrl = normalizeBaseUrl((import.meta.env.VITE_CHATBOT_URL || "").trim());

  if (rawChatbotUrl && !shouldIgnoreLoopbackUrl(rawChatbotUrl)) {
    return rawChatbotUrl;
  }

  return `${API_URL}/qr`;
}

export function getToken() {
  const session = getAuthSession();

  if (session?.token) {
    return session.token;
  }

  return localStorage.getItem(LEGACY_TOKEN_STORAGE_KEY);
}

export function getAuthSession() {
  const serialized = localStorage.getItem(SESSION_STORAGE_KEY);

  if (!serialized) {
    return null;
  }

  try {
    return JSON.parse(serialized);
  } catch (error) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export function setAuthSession(session) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  localStorage.setItem(LEGACY_TOKEN_STORAGE_KEY, session.token);
}

export function clearAuthSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
}

export function getCurrentUser() {
  return getAuthSession()?.user || null;
}

export function getCurrentBarbershop() {
  return getCurrentUser()?.barbearia || null;
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers
    });
  } catch (error) {
    throw new Error("Nao foi possivel conectar com a API. Verifique se o backend esta ligado.");
  }

  if (!response.ok) {
    const errorJson = await response.json().catch(() => null);
    const errorText = errorJson?.error || errorJson?.message;

    if (response.status === 401) {
      clearAuthSession();
    }

    if (errorText) {
      throw new Error(errorText);
    }

    throw new Error(`Erro na API (${response.status})`);
  }

  return response.json();
}
