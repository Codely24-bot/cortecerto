const API_URL = import.meta.env.VITE_API_URL || "/api";

export function getToken() {
  return localStorage.getItem("admin_token");
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

    if (errorText) {
      throw new Error(errorText);
    }

    throw new Error(`Erro na API (${response.status})`);
  }

  return response.json();
}
