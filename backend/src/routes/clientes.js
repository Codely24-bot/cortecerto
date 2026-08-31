import express from "express";
import { getRequestBarbershopId, requireAdmin } from "../middleware/auth.js";
import { query } from "../db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.get("/clientes", requireAdmin, asyncHandler(async (req, res) => {
  const currentBarbershop = getRequestBarbershopId(req);
  const result = await query(
    `
      SELECT
        a.nome,
        MAX(a.telefone) AS telefone,
        COUNT(*) AS visitas,
        MAX(a.data) AS ultima_visita,
        SUM(COALESCE(ps.valor_cobrado, 0)) AS total_gasto
      FROM agendamentos a
      LEFT JOIN (
        SELECT
          ag.id AS agendamento_id,
          COALESCE(pa.valor, s.preco, 0) AS valor_cobrado
        FROM agendamentos ag
        LEFT JOIN pagamentos_atendimento pa
          ON pa.agendamento_id = ag.id
        LEFT JOIN servicos s
          ON s.barbearia_id = ag.barbearia_id
         AND s.nome = ag.servico
      ) ps ON ps.agendamento_id = a.id
      WHERE a.barbearia_id = $1
        AND a.nome IS NOT NULL
        AND a.nome != ''
      GROUP BY a.nome
      ORDER BY total_gasto DESC, a.nome ASC
    `,
    [currentBarbershop]
  );

  return res.json(result.rows);
}));

export default router;
