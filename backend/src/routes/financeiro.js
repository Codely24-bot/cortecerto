import express from "express";
import { z } from "zod";
import { query } from "../db.js";
import { getRequestBarbershopId, requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

const PAYMENT_STATUSES = ["pago", "pendente"];
const PAYMENT_METHODS = [
  "dinheiro",
  "pix",
  "cartao_debito",
  "cartao_credito",
  "fiado",
  "nao_informado",
  "outro"
];

const paymentUpdateSchema = z.object({
  status: z.enum(PAYMENT_STATUSES),
  metodo: z.enum(PAYMENT_METHODS).optional(),
  dataPagamento: z.string().nullable().optional(),
  valor: z.coerce.number().nonnegative("Valor invalido").optional()
});

router.get("/financeiro/atendimentos", requireAdmin, asyncHandler(async (req, res) => {
  const {
    dataInicio,
    dataFim,
    statusPagamento,
    metodoPagamento
  } = req.query;
  const currentBarbershop = getRequestBarbershopId(req);

  const result = await query(
    `
      SELECT
        a.id,
        a.barbearia_id,
        a.nome,
        a.telefone,
        a.data,
        a.hora,
        a.servico,
        a.status,
        a.criado_em,
        COALESCE(pa.status, 'pendente') AS status_pagamento,
        COALESCE(pa.metodo, 'nao_informado') AS metodo_pagamento,
        pa.data_pagamento,
        COALESCE(pa.valor, s.preco, 0) AS valor_cobrado
      FROM agendamentos a
      LEFT JOIN pagamentos_atendimento pa
        ON pa.agendamento_id = a.id
      LEFT JOIN servicos s
        ON s.barbearia_id = a.barbearia_id
       AND s.nome = a.servico
      WHERE a.barbearia_id = $1
        AND ($2::date IS NULL OR a.data >= $2::date)
        AND ($3::date IS NULL OR a.data <= $3::date)
        AND ($4::text IS NULL OR COALESCE(pa.status, 'pendente') = $4)
        AND ($5::text IS NULL OR COALESCE(pa.metodo, 'nao_informado') = $5)
      ORDER BY a.data DESC, a.hora DESC, a.id DESC
    `,
    [
      currentBarbershop,
      dataInicio || null,
      dataFim || null,
      statusPagamento || null,
      metodoPagamento || null
    ]
  );

  return res.json(result.rows);
}));

router.put("/financeiro/atendimentos/:id/pagamento", requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const currentBarbershop = getRequestBarbershopId(req);
  const parsed = paymentUpdateSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Dados invalidos",
      details: parsed.error.flatten()
    });
  }

  const appointmentResult = await query(
    `
      SELECT
        a.id,
        a.barbearia_id,
        a.nome,
        a.telefone,
        a.data,
        a.hora,
        a.servico,
        a.status,
        s.preco
      FROM agendamentos a
      LEFT JOIN servicos s
        ON s.barbearia_id = a.barbearia_id
       AND s.nome = a.servico
      WHERE a.id = $1
        AND a.barbearia_id = $2
      LIMIT 1
    `,
    [id, currentBarbershop]
  );

  if (!appointmentResult.rows.length) {
    return res.status(404).json({ error: "Agendamento nao encontrado" });
  }

  const appointment = appointmentResult.rows[0];

  if (appointment.status === "cancelado") {
    return res.status(409).json({
      error: "Nao e possivel registrar pagamento para um agendamento cancelado"
    });
  }

  const currentPaymentResult = await query(
    `
      SELECT id, metodo
      FROM pagamentos_atendimento
      WHERE agendamento_id = $1
        AND barbearia_id = $2
      LIMIT 1
    `,
    [id, currentBarbershop]
  );

  const currentPayment = currentPaymentResult.rows[0] || null;
  const paymentStatus = parsed.data.status;
  const paymentMethod =
    parsed.data.metodo ||
    currentPayment?.metodo ||
    (paymentStatus === "pago" ? "dinheiro" : "nao_informado");
  const paymentDate =
    paymentStatus === "pago"
      ? parsed.data.dataPagamento || new Date().toISOString().slice(0, 10)
      : parsed.data.dataPagamento || null;
  const servicePrice = Number(appointment.preco || 0);
  const paymentValue = parsed.data.valor ?? servicePrice;

  const result = await query(
    `
      INSERT INTO pagamentos_atendimento
        (agendamento_id, barbearia_id, cliente_nome, cliente_telefone, servico, valor, data_pagamento, status, metodo)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (agendamento_id)
      DO UPDATE SET
        cliente_nome = EXCLUDED.cliente_nome,
        cliente_telefone = EXCLUDED.cliente_telefone,
        servico = EXCLUDED.servico,
        valor = EXCLUDED.valor,
        data_pagamento = EXCLUDED.data_pagamento,
        status = EXCLUDED.status,
        metodo = EXCLUDED.metodo
      RETURNING *
    `,
    [
      appointment.id,
      appointment.barbearia_id,
      appointment.nome,
      appointment.telefone,
      appointment.servico,
      paymentValue,
      paymentDate,
      paymentStatus,
      paymentMethod
    ]
  );

  return res.json(result.rows[0]);
}));

export default router;
