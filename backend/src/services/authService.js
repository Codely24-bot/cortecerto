import crypto from "crypto";
import { promisify } from "util";
import { query } from "../db.js";
import {
  DEFAULT_BARBERSHOP_ID,
  DEFAULT_BARBERSHOP_NAME,
  getAuthTokenSecret,
  getAuthTokenTtlDays,
  getServiceAdminToken
} from "../config.js";
import { getDefaultServices } from "./serviceCatalog.js";

const scryptAsync = promisify(crypto.scrypt);
const PASSWORD_PREFIX = "scrypt";
const PASSWORD_KEY_LENGTH = 64;
const DEFAULT_BARBERSHOP_PLAN_NAME = "Plano SaaS Mensal";
const DEFAULT_BARBERSHOP_PLAN_PRICE = 99.9;

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (normalized.length % 4)) % 4;
  return Buffer.from(`${normalized}${"=".repeat(paddingLength)}`, "base64").toString("utf8");
}

function signValue(value) {
  return crypto
    .createHmac("sha256", getAuthTokenSecret())
    .update(value)
    .digest("base64url");
}

function normalizeEmail(email = "") {
  return email.trim().toLowerCase();
}

function mapUserRow(row) {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    cargo: row.cargo,
    tipoConta: row.tipo_conta,
    barbearia: {
      id: row.barbearia_id,
      nome: row.barbearia_nome,
      slug: row.barbearia_slug,
      planoNome: row.plano_nome || DEFAULT_BARBERSHOP_PLAN_NAME,
      valorMensal: Number(row.valor_mensal || DEFAULT_BARBERSHOP_PLAN_PRICE),
      statusAssinatura: row.status_assinatura || "ativa"
    }
  };
}

function buildBaseSlug(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "barbearia";
}

export function buildSignedAuthToken(payload) {
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = signValue(body);
  return `${body}.${signature}`;
}

export function parseSignedAuthToken(token) {
  if (!token || !token.includes(".")) {
    return null;
  }

  const [body, signature] = token.split(".");

  if (!body || !signature) {
    return null;
  }

  const expectedSignature = signValue(body);

  if (signature.length !== expectedSignature.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(body));

    if (!payload?.sub || payload?.kind !== "panel-session") {
      return null;
    }

    if (payload.exp && Date.now() > Number(payload.exp)) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt, PASSWORD_KEY_LENGTH);
  return `${PASSWORD_PREFIX}$${salt}$${Buffer.from(derivedKey).toString("hex")}`;
}

export async function verifyPassword(password, storedHash) {
  const [prefix, salt, hash] = String(storedHash || "").split("$");

  if (prefix !== PASSWORD_PREFIX || !salt || !hash) {
    return false;
  }

  const derivedKey = await scryptAsync(password, salt, PASSWORD_KEY_LENGTH);
  const storedHashBuffer = Buffer.from(hash, "hex");
  const derivedKeyBuffer = Buffer.from(derivedKey);

  if (storedHashBuffer.length !== derivedKeyBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedHashBuffer, derivedKeyBuffer);
}

export async function generateUniqueBarbershopSlug(executor, nomeBarbearia) {
  const baseSlug = buildBaseSlug(nomeBarbearia);
  let suffix = 1;

  while (true) {
    const candidate = suffix === 1 ? baseSlug : `${baseSlug}-${suffix}`;
    const existing = await executor.query(
      `
        SELECT 1
        FROM barbearias
        WHERE slug = $1
        LIMIT 1
      `,
      [candidate]
    );

    if (!existing.rows.length) {
      return candidate;
    }

    suffix += 1;
  }
}

export async function insertDefaultServicesForBarbershop(executor, barbeariaId) {
  const existing = await executor.query(
    `
      SELECT COUNT(*)::int AS total
      FROM servicos
      WHERE barbearia_id = $1
    `,
    [barbeariaId]
  );

  if (existing.rows[0]?.total > 0) {
    return;
  }

  for (const service of getDefaultServices()) {
    await executor.query(
      `
        INSERT INTO servicos (barbearia_id, nome, duracao, preco)
        VALUES ($1, $2, $3, $4)
      `,
      [barbeariaId, service.nome, service.duracao, service.preco]
    );
  }
}

export function buildSessionPayload(userId) {
  return {
    kind: "panel-session",
    sub: userId,
    exp: Date.now() + getAuthTokenTtlDays() * 24 * 60 * 60 * 1000
  };
}

export async function findPanelUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  const result = await query(
    `
      SELECT
        u.id,
        u.barbearia_id,
        u.nome,
        u.email,
        u.senha_hash,
        u.cargo,
        u.tipo_conta,
        u.ativo,
        b.nome AS barbearia_nome,
        b.slug AS barbearia_slug,
        b.plano_nome,
        b.valor_mensal,
        b.status_assinatura
      FROM usuarios_painel u
      INNER JOIN barbearias b
        ON b.id = u.barbearia_id
      WHERE LOWER(u.email) = $1
      LIMIT 1
    `,
    [normalizedEmail]
  );

  return result.rows[0] || null;
}

export async function findPanelUserById(userId) {
  const result = await query(
    `
      SELECT
        u.id,
        u.barbearia_id,
        u.nome,
        u.email,
        u.cargo,
        u.tipo_conta,
        u.ativo,
        b.nome AS barbearia_nome,
        b.slug AS barbearia_slug,
        b.plano_nome,
        b.valor_mensal,
        b.status_assinatura
      FROM usuarios_painel u
      INNER JOIN barbearias b
        ON b.id = u.barbearia_id
      WHERE u.id = $1
      LIMIT 1
    `,
    [userId]
  );

  const row = result.rows[0];

  if (!row || !row.ativo) {
    return null;
  }

  return mapUserRow(row);
}

export async function resolveAuthContext(token) {
  const serviceToken = getServiceAdminToken();

  if (serviceToken && token === serviceToken) {
    return {
      type: "service",
      userId: null,
      email: null,
      nome: "Servico interno",
      cargo: "system",
      tipoConta: "integracao",
      barbeariaId: DEFAULT_BARBERSHOP_ID,
      barbeariaNome: DEFAULT_BARBERSHOP_NAME,
      barbeariaSlug: null
    };
  }

  const payload = parseSignedAuthToken(token);

  if (!payload) {
    return null;
  }

  const user = await findPanelUserById(payload.sub);

  if (!user) {
    return null;
  }

  return {
    type: "panel",
    userId: user.id,
    email: user.email,
    nome: user.nome,
    cargo: user.cargo,
    tipoConta: user.tipoConta,
    barbeariaId: user.barbearia.id,
    barbeariaNome: user.barbearia.nome,
    barbeariaSlug: user.barbearia.slug,
    barbearia: user.barbearia,
    user
  };
}

export function normalizePanelEmail(email) {
  return normalizeEmail(email);
}

export function toPanelUserPayload(row) {
  return mapUserRow(row);
}
