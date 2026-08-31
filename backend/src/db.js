import { DatabaseSync } from "node:sqlite";
import dotenv from "dotenv";
import { transpile } from "./pgToSqlite.js";

dotenv.config();

const isMock = !process.env.DATABASE_URL || process.env.MOCK_DB === "true";

let db = null;

function initDatabase() {
  db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  createSchema(db);
  return db;
}

function createSchema(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS barbearias (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      slug TEXT,
      responsavel_nome TEXT,
      email_contato TEXT,
      tipo_cadastro TEXT NOT NULL DEFAULT 'barbearia',
      plano_nome TEXT NOT NULL DEFAULT 'Plano SaaS Mensal',
      valor_mensal REAL NOT NULL DEFAULT 99.90,
      status_assinatura TEXT NOT NULL DEFAULT 'ativa',
      criado_em TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_barbearias_slug_unique ON barbearias(slug);

    CREATE TABLE IF NOT EXISTS usuarios_painel (
      id TEXT PRIMARY KEY,
      barbearia_id TEXT NOT NULL REFERENCES barbearias(id) ON DELETE CASCADE,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      cargo TEXT NOT NULL DEFAULT 'owner',
      tipo_conta TEXT NOT NULL DEFAULT 'barbearia',
      ativo INTEGER NOT NULL DEFAULT 1,
      ultimo_login_em TEXT,
      criado_em TEXT NOT NULL DEFAULT (datetime('now')),
      atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS servicos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barbearia_id TEXT NOT NULL REFERENCES barbearias(id),
      nome TEXT NOT NULL,
      duracao INTEGER NOT NULL,
      preco REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS horarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barbearia_id TEXT NOT NULL REFERENCES barbearias(id),
      data TEXT NOT NULL,
      hora TEXT NOT NULL,
      disponivel INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS agendamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barbearia_id TEXT NOT NULL REFERENCES barbearias(id),
      nome TEXT NOT NULL,
      telefone TEXT NOT NULL,
      data TEXT NOT NULL,
      hora TEXT NOT NULL,
      servico TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmado',
      criado_em TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS planos_assinatura (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barbearia_id TEXT NOT NULL REFERENCES barbearias(id),
      nome TEXT NOT NULL,
      valor REAL NOT NULL,
      cortes_inclusos INTEGER NOT NULL,
      validade_dias INTEGER NOT NULL DEFAULT 30,
      ativo INTEGER NOT NULL DEFAULT 1,
      criado_em TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS clientes_assinatura (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barbearia_id TEXT NOT NULL REFERENCES barbearias(id),
      plano_id INTEGER NOT NULL REFERENCES planos_assinatura(id),
      nome TEXT NOT NULL,
      telefone TEXT NOT NULL,
      data_adesao TEXT NOT NULL DEFAULT (date('now')),
      data_vencimento TEXT NOT NULL,
      status_pagamento TEXT NOT NULL DEFAULT 'pendente',
      ativo INTEGER NOT NULL DEFAULT 1,
      observacoes TEXT,
      criado_em TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pagamentos_assinatura (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER NOT NULL REFERENCES clientes_assinatura(id) ON DELETE CASCADE,
      barbearia_id TEXT NOT NULL REFERENCES barbearias(id),
      valor REAL NOT NULL,
      competencia TEXT NOT NULL,
      data_pagamento TEXT NOT NULL DEFAULT (date('now')),
      status TEXT NOT NULL DEFAULT 'pago',
      metodo TEXT NOT NULL DEFAULT 'manual',
      criado_em TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pagamentos_atendimento (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agendamento_id INTEGER NOT NULL UNIQUE REFERENCES agendamentos(id) ON DELETE CASCADE,
      barbearia_id TEXT NOT NULL REFERENCES barbearias(id),
      cliente_nome TEXT NOT NULL,
      cliente_telefone TEXT NOT NULL,
      servico TEXT NOT NULL,
      valor REAL NOT NULL,
      data_pagamento TEXT DEFAULT (date('now')),
      status TEXT NOT NULL DEFAULT 'pendente',
      metodo TEXT NOT NULL DEFAULT 'nao_informado',
      criado_em TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS consumos_assinatura (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER NOT NULL REFERENCES clientes_assinatura(id) ON DELETE CASCADE,
      barbearia_id TEXT NOT NULL REFERENCES barbearias(id),
      data_consumo TEXT NOT NULL DEFAULT (date('now')),
      descricao TEXT NOT NULL DEFAULT 'Corte',
      quantidade INTEGER NOT NULL DEFAULT 1,
      agendamento_id INTEGER REFERENCES agendamentos(id) ON DELETE SET NULL,
      criado_em TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS lembretes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barbearia_id TEXT NOT NULL REFERENCES barbearias(id),
      referencia_tipo TEXT NOT NULL,
      referencia_id INTEGER NOT NULL,
      categoria TEXT NOT NULL,
      telefone TEXT NOT NULL,
      nome_cliente TEXT NOT NULL,
      mensagem TEXT NOT NULL,
      agendado_para TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pendente',
      tentativas INTEGER NOT NULL DEFAULT 0,
      ultimo_erro TEXT,
      enviado_em TEXT,
      criado_em TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_horarios_data ON horarios(data);
    CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data);
    CREATE INDEX IF NOT EXISTS idx_servicos_barbearia_id ON servicos(barbearia_id);
    CREATE INDEX IF NOT EXISTS idx_horarios_barbearia_id ON horarios(barbearia_id);
    CREATE INDEX IF NOT EXISTS idx_agendamentos_barbearia_id ON agendamentos(barbearia_id);
  `);
}

function getDb() {
  if (!db) {
    initDatabase();
  }
  return db;
}

function isTransactionalKeyword(sql) {
  const s = sql.trim().toUpperCase();
  return s === "BEGIN" || s === "COMMIT" || s === "ROLLBACK";
}

export function query(text, params = []) {
  const database = getDb();
  const trimmed = text.trim();
  const upper = trimmed.toUpperCase();

  if (isTransactionalKeyword(trimmed)) {
    database.exec(trimmed);
    return { rows: [], rowCount: 0 };
  }

  // skip DDL / unsupported statements
  if (
    /^(CREATE|ALTER|DROP|CREATE\s+INDEX|CREATE\s+UNIQUE)/i.test(trimmed)
  ) {
    return { rows: [], rowCount: 0 };
  }
  if (trimmed.startsWith("SELECT") || /^SELECT/i.test(trimmed)) {
    const sql = transpile(text, params);
    const rows = database.prepare(sql).all();
    return { rows, rowCount: rows.length };
  }
  if (/^INSERT/i.test(trimmed) || /^UPDATE/i.test(trimmed) || /^DELETE/i.test(trimmed)) {
    const hasReturning = /RETURNING/i.test(trimmed);
    const sql = transpile(text, params);
    if (hasReturning) {
      const rows = database.prepare(sql).all();
      return { rows, rowCount: rows.length };
    }
    const stmt = database.prepare(sql);
    const info = stmt.run();
    return { rows: [], rowCount: Number(info.changes || 0) };
  }
  // fallback (e.g. other statements)
  const sql = transpile(text, params);
  const stmt = database.prepare(sql);
  const info = stmt.run();
  return { rows: [], rowCount: Number(info.changes || 0) };
}

export const pool = {
  connect: async () => ({
    query: (text, params = []) => query(text, params),
    release: () => {}
  }),
  query: (text, params = []) => query(text, params)
};

let initialized = false;
let databaseReady = isMock;

export function getDatabaseStatus() {
  return {
    ready: getDb() ? true : databaseReady,
    initialized,
    hasConnectionString: Boolean(process.env.DATABASE_URL),
    ssl: false,
    error: null,
    mock: isMock
  };
}

export async function initializeDatabase() {
  getDb();
  initialized = true;
  databaseReady = true;
  return getDatabaseStatus();
}

export async function checkDatabaseConnection() {
  getDb();
  databaseReady = true;
  return getDatabaseStatus();
}
