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

export function todayIso() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function isoDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function isoDaysAhead(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatBRL(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function qs(params) {
  if (!params) return "";
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") search.set(k, v);
  });
  const s = search.toString();
  return s ? `?${s}` : "";
}

export const api = {
  async me() {
    return apiFetch("/auth/me");
  },
  async metricas() {
    return apiFetch("/relatorios/metricas");
  },
  async resumo(data) {
    return apiFetch(`/relatorios/resumo${qs({ data })}`);
  },
  async faturamentoSemanal() {
    return apiFetch("/relatorios/faturamento-semanal");
  },
  async clientes() {
    return apiFetch("/clientes");
  },
  async agendamentos(data) {
    return apiFetch(`/agendamentos${qs({ data })}`);
  },
  async criarAgendamento(payload) {
    return apiFetch("/agendar", { method: "POST", body: JSON.stringify(payload) });
  },
  async atualizarAgendamento(id, payload) {
    return apiFetch(`/agendamento/${id}`, { method: "PUT", body: JSON.stringify(payload) });
  },
  async cancelarAgendamento(id) {
    return apiFetch(`/agendamento/${id}`, { method: "DELETE" });
  },
  async concluirAgendamento(id) {
    return apiFetch(`/agendamento/${id}/concluir`, { method: "POST" });
  },
  async horarios(dataInicial, dataFinal) {
    return apiFetch(`/horarios${qs({ dataInicial, dataFinal })}`);
  },
  async gerarSemana(dataInicial) {
    return apiFetch("/horarios/gerar-semana", {
      method: "POST",
      body: JSON.stringify({ dataInicial })
    });
  },
  async criarHorario(data, hora) {
    return apiFetch("/horarios", { method: "POST", body: JSON.stringify({ data, hora }) });
  },
  async excluirHorarios(data) {
    return apiFetch(`/horarios${qs({ data })}`, { method: "DELETE" });
  },
  async alternarDisponibilidade(id, disponivel) {
    return apiFetch(`/horarios/${id}/disponibilidade`, {
      method: "PUT",
      body: JSON.stringify({ disponivel })
    });
  },
  async servicos() {
    return apiFetch("/servicos");
  },
  async criarServico(payload) {
    return apiFetch("/servicos", { method: "POST", body: JSON.stringify(payload) });
  },
  async atualizarServico(id, payload) {
    return apiFetch(`/servicos/${id}`, { method: "PUT", body: JSON.stringify(payload) });
  },
  async excluirServico(id) {
    return apiFetch(`/servicos/${id}`, { method: "DELETE" });
  },
  async financeiro(filters) {
    return apiFetch(`/financeiro/atendimentos${qs(filters)}`);
  },
  async registrarPagamento(id, payload) {
    return apiFetch(`/financeiro/atendimentos/${id}/pagamento`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  },
  async chatbotStatus() {
    return apiFetch("/chatbot/status");
  },
  async assinaturasResumo() {
    return apiFetch("/assinaturas/resumo");
  },
  async planos() {
    return apiFetch("/assinaturas/planos");
  },
  async assinantes(status) {
    return apiFetch(`/assinaturas/clientes${qs({ status })}`);
  },
  async criarAssinante(payload) {
    return apiFetch("/assinaturas/clientes", { method: "POST", body: JSON.stringify(payload) });
  },
  async pagarAssinatura(id, payload) {
    return apiFetch(`/assinaturas/clientes/${id}/pagamentos`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  async consumirAssinatura(id, payload) {
    return apiFetch(`/assinaturas/clientes/${id}/consumos`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }
};
