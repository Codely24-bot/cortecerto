import dotenv from "dotenv";

dotenv.config();

export const DEFAULT_BARBERSHOP_ID = process.env.BARBEARIA_ID || "default";
export const DEFAULT_BARBERSHOP_NAME =
  process.env.BARBEARIA_NOME || "CORTE CERTO";
export const BARBERSHOP_TIMEZONE =
  process.env.BARBEARIA_TIMEZONE || "America/Sao_Paulo";

const DEFAULT_AUTH_TOKEN_SECRET = "dev-auth-secret-change-me";
const DEFAULT_AUTH_TOKEN_TTL_DAYS = 30;
const DATABASE_PLACEHOLDERS = ["PROJECT_REF", "REGION", "SENHA_REAL", "SUA_SENHA"];
const RAILWAY_ENV_KEYS = [
  "RAILWAY_ENVIRONMENT",
  "RAILWAY_PROJECT_ID",
  "RAILWAY_SERVICE_ID",
  "RAILWAY_PUBLIC_DOMAIN",
  "RAILWAY_STATIC_URL"
];

export function getAuthTokenSecret() {
  return process.env.AUTH_TOKEN_SECRET || process.env.ADMIN_PASS || DEFAULT_AUTH_TOKEN_SECRET;
}

export function getServiceAdminToken() {
  return (process.env.SERVICE_AUTH_TOKEN || process.env.ADMIN_PASS || "").trim();
}

export function getMasterAdminEmail() {
  return (process.env.ADMIN_EMAIL || "admin@cortecerto.local").trim().toLowerCase();
}

export function getMasterAdminPassword() {
  return (process.env.ADMIN_PASS || "").trim();
}

export function isMasterAdminEnabled() {
  return Boolean(getMasterAdminPassword());
}

export function getAuthTokenTtlDays() {
  const parsed = Number(process.env.AUTH_TOKEN_TTL_DAYS || DEFAULT_AUTH_TOKEN_TTL_DAYS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_AUTH_TOKEN_TTL_DAYS;
}

export function getPublicApiUrl() {
  return process.env.API_URL || "";
}

export function getDatabaseUrl() {
  return process.env.DATABASE_URL || "";
}

export function isMockDatabase() {
  return process.env.MOCK_DB === "true" || !getDatabaseUrl();
}

export function isRailwayRuntime() {
  return RAILWAY_ENV_KEYS.some((key) => Boolean(process.env[key]));
}

export function getRuntimeSummary() {
  const databaseUrl = getDatabaseUrl();
  let databaseHost = "";

  try {
    databaseHost = databaseUrl ? new URL(databaseUrl).hostname : "";
  } catch (error) {
    databaseHost = "";
  }

  return {
    barbeariaId: DEFAULT_BARBERSHOP_ID,
    apiUrl: getPublicApiUrl(),
    databaseHost,
    hasDatabaseUrl: Boolean(databaseUrl)
  };
}

export function validateRuntimeConfig() {
  const errors = [];
  const warnings = [];
  const databaseUrl = getDatabaseUrl();
  const apiUrl = getPublicApiUrl();
  const railwayRuntime = isRailwayRuntime();
  const authTokenSecret = getAuthTokenSecret();
  const mockDatabase = isMockDatabase();

  if (!databaseUrl && !mockDatabase) {
    errors.push("DATABASE_URL nao configurada.");
  }

  if (databaseUrl && DATABASE_PLACEHOLDERS.some((item) => databaseUrl.includes(item))) {
    errors.push(
      "DATABASE_URL ainda contem placeholders. Cole a string real do Supabase."
    );
  }

  if (databaseUrl) {
    try {
      const parsed = new URL(databaseUrl);

      if (parsed.hostname.startsWith("db.") && parsed.hostname.endsWith(".supabase.co")) {
        if (railwayRuntime) {
          errors.push(
            "DATABASE_URL esta usando o host direto db.<projeto>.supabase.co. No Railway use a URI de Connection Pooling (...pooler.supabase.com)."
          );
        } else {
          warnings.push(
            "DATABASE_URL esta usando o host direto db.<projeto>.supabase.co. Isso pode funcionar localmente, mas no Railway troque para a URI de Connection Pooling (...pooler.supabase.com)."
          );
        }
      }

      if (!parsed.username || !parsed.password) {
        warnings.push(
          "DATABASE_URL parece sem usuario ou senha completos. Confira a URI copiada do Supabase."
        );
      }
    } catch (error) {
      errors.push("DATABASE_URL esta em formato invalido.");
    }
  }

  if (!apiUrl) {
    warnings.push(
      "API_URL nao configurada. Defina a URL publica do servico no Railway para links absolutos."
    );
  } else if (!/^https?:\/\//i.test(apiUrl)) {
    errors.push("API_URL deve comecar com http:// ou https://");
  }

  if (authTokenSecret === DEFAULT_AUTH_TOKEN_SECRET) {
    warnings.push(
      "AUTH_TOKEN_SECRET nao configurado. Defina um segredo forte antes de publicar o SaaS."
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
