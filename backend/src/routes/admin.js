import express from "express";
import crypto from "crypto";
import { z } from "zod";
import { pool } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  buildSessionPayload,
  buildSignedAuthToken,
  findPanelUserByEmail,
  generateUniqueBarbershopSlug,
  hashPassword,
  insertDefaultServicesForBarbershop,
  normalizePanelEmail,
  toPanelUserPayload,
  verifyPassword
} from "../services/authService.js";

const router = express.Router();

const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail valido"),
  senha: z.string().min(8, "A senha deve ter pelo menos 8 caracteres")
});

const registerSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do responsavel"),
  nomeBarbearia: z.string().trim().min(2, "Informe o nome da barbearia"),
  email: z.string().trim().email("Informe um e-mail valido"),
  senha: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
  tipoConta: z.enum(["barbearia", "barbeiro"]).default("barbearia")
});

async function loadPanelUser(client, userId) {
  const result = await client.query(
    `
      SELECT
        u.id,
        u.barbearia_id,
        u.nome,
        u.email,
        u.cargo,
        u.tipo_conta,
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

  return result.rows[0] ? toPanelUserPayload(result.rows[0]) : null;
}

router.post("/auth/register", asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body || {});

  if (!parsed.success) {
    return res.status(400).json({
      error: "Dados invalidos",
      details: parsed.error.flatten()
    });
  }

  const normalizedEmail = normalizePanelEmail(parsed.data.email);
  const passwordHash = await hashPassword(parsed.data.senha);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      `
        SELECT id
        FROM usuarios_painel
        WHERE LOWER(email) = $1
        LIMIT 1
      `,
      [normalizedEmail]
    );

    if (existing.rows.length) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Ja existe uma conta cadastrada com este e-mail" });
    }

    const barbeariaId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const barbeariaSlug = await generateUniqueBarbershopSlug(client, parsed.data.nomeBarbearia);

    await client.query(
      `
        INSERT INTO barbearias
          (id, nome, slug, responsavel_nome, email_contato, tipo_cadastro, plano_nome, valor_mensal, status_assinatura)
        VALUES
          ($1, $2, $3, $4, $5, $6, 'Plano SaaS Mensal', 99.90, 'ativa')
      `,
      [
        barbeariaId,
        parsed.data.nomeBarbearia,
        barbeariaSlug,
        parsed.data.nome,
        normalizedEmail,
        parsed.data.tipoConta
      ]
    );

    await client.query(
      `
        INSERT INTO usuarios_painel
          (id, barbearia_id, nome, email, senha_hash, cargo, tipo_conta)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        userId,
        barbeariaId,
        parsed.data.nome,
        normalizedEmail,
        passwordHash,
        parsed.data.tipoConta === "barbeiro" ? "barbeiro" : "owner",
        parsed.data.tipoConta
      ]
    );

    await insertDefaultServicesForBarbershop(client, barbeariaId);
    await client.query("COMMIT");

    const user = await loadPanelUser(client, userId);
    const token = buildSignedAuthToken(buildSessionPayload(userId));
    return res.status(201).json({ token, user });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ error: "Falha ao criar a conta da barbearia" });
  } finally {
    client.release();
  }
}));

router.post("/auth/login", asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body || {});

  if (!parsed.success) {
    return res.status(400).json({
      error: "Dados invalidos",
      details: parsed.error.flatten()
    });
  }

  const user = await findPanelUserByEmail(parsed.data.email);

  if (!user?.ativo) {
    return res.status(401).json({ error: "Credenciais invalidas" });
  }

  const passwordMatches = await verifyPassword(parsed.data.senha, user.senha_hash);

  if (!passwordMatches) {
    return res.status(401).json({ error: "Credenciais invalidas" });
  }

  await pool.query(
    `
      UPDATE usuarios_painel
      SET ultimo_login_em = NOW(),
          atualizado_em = NOW()
      WHERE id = $1
    `,
    [user.id]
  );

  const token = buildSignedAuthToken(buildSessionPayload(user.id));
  return res.json({
    token,
    user: toPanelUserPayload(user)
  });
}));

router.get("/auth/me", requireAdmin, (req, res) => {
  if (!req.auth?.user) {
    return res.json({
      user: {
        id: null,
        nome: req.auth?.nome || "Servico interno",
        email: req.auth?.email || null,
        cargo: req.auth?.cargo || "system",
        tipoConta: req.auth?.tipoConta || "integracao",
        barbearia: {
          id: req.auth?.barbeariaId || null,
          nome: req.auth?.barbeariaNome || null,
          slug: req.auth?.barbeariaSlug || null,
          planoNome: "Plano SaaS Mensal",
          valorMensal: 99.9,
          statusAssinatura: "ativa"
        }
      }
    });
  }

  return res.json({ user: req.auth.user });
});

export default router;
