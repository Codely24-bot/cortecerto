import express from "express";
import { getRequestBarbershopId, requireAdmin } from "../middleware/auth.js";
import { query } from "../db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.get("/relatorios/resumo", requireAdmin, asyncHandler(async (req, res) => {
  const { data } = req.query;
  const currentBarbershop = getRequestBarbershopId(req);
  const result = await query(
    `
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE a.status = 'confirmado') AS confirmados,
        COUNT(*) FILTER (WHERE a.status = 'cancelado') AS cancelados,
        COUNT(*) FILTER (WHERE a.status = 'concluido') AS concluidos,
        COALESCE(SUM(s.preco), 0) AS faturamento_estimado
      FROM agendamentos a
      LEFT JOIN servicos s
        ON s.nome = a.servico
       AND s.barbearia_id = a.barbearia_id
      WHERE ($1::date IS NULL OR a.data = $1::date)
        AND a.barbearia_id = $2
    `,
    [data || null, currentBarbershop]
  );

  return res.json(result.rows[0]);
}));

router.get("/relatorios/faturamento-semanal", requireAdmin, asyncHandler(async (req, res) => {
  const currentBarbershop = getRequestBarbershopId(req);

  const result = await query(
    `
      SELECT
        a.data,
        SUM(COALESCE(pa.valor, s.preco, 0)) AS valor
      FROM agendamentos a
      LEFT JOIN pagamentos_atendimento pa
        ON pa.agendamento_id = a.id
      LEFT JOIN servicos s
        ON s.barbearia_id = a.barbearia_id
       AND s.nome = a.servico
      WHERE a.barbearia_id = $1
        AND a.data >= date('now', '-6 days')
        AND a.status IN ('concluido', 'confirmado')
      GROUP BY a.data
      ORDER BY a.data ASC
    `,
    [currentBarbershop]
  );

  const valorPorData = new Map(
    result.rows.map((row) => [String(row.data).slice(0, 10), Number(row.valor) || 0])
  );

  const dias = [];
  const now = new Date();
  for (let offset = 6; offset >= 0; offset -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - offset);
    const key = d.toISOString().slice(0, 10);
    dias.push({
      data: key,
      valor: valorPorData.get(key) || 0
    });
  }

  return res.json(dias);
}));

router.get("/relatorios/metricas", requireAdmin, asyncHandler(async (req, res) => {
  const currentBarbershop = getRequestBarbershopId(req);

  const [todayResult, monthResult, clientsResult] = await Promise.all([
    query(
      `
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE a.status = 'confirmado') AS confirmados,
          COUNT(*) FILTER (WHERE a.status = 'concluido') AS concluidos,
          COUNT(*) FILTER (WHERE a.status = 'cancelado') AS cancelados,
          COALESCE(SUM(s.preco), 0) AS faturamento
        FROM agendamentos a
        LEFT JOIN servicos s
          ON s.barbearia_id = a.barbearia_id
         AND s.nome = a.servico
        WHERE a.barbearia_id = $1
          AND a.data = date('now')
      `,
      [currentBarbershop]
    ),
    query(
      `
        SELECT COALESCE(SUM(pa.valor), 0) AS faturamento_mes
        FROM pagamentos_atendimento pa
        WHERE pa.barbearia_id = $1
          AND pa.status = 'pago'
          AND substr(pa.data_pagamento, 1, 7) = substr(date('now'), 1, 7)
      `,
      [currentBarbershop]
    ),
    query(
      `
        SELECT COUNT(DISTINCT a.nome) AS total
        FROM agendamentos a
        WHERE a.barbearia_id = $1
          AND a.nome IS NOT NULL
          AND a.nome != ''
      `,
      [currentBarbershop]
    )
  ]);

  const today = todayResult.rows[0] || {};
  return res.json({
    agendamentosHoje: Number(today.total || 0),
    concluidosHoje: Number(today.concluidos || 0),
    canceladosHoje: Number(today.cancelados || 0),
    faturamentoHoje: Number(today.faturamento || 0),
    faturamentoMes: Number(monthResult.rows[0]?.faturamento_mes || 0),
    clientesAtivos: Number(clientsResult.rows[0]?.total || 0)
  });
}));

export default router;
