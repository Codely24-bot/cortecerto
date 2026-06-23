import { dispatchPendingReminders } from "../../backend/src/services/reminders.js";
import { validateRuntimeConfig } from "../../backend/src/config.js";

function isAuthorized(req) {
  return req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`;
}

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const validation = validateRuntimeConfig();

  if (!validation.valid) {
    return res.status(500).json({
      error: "Configuracao invalida para executar cron de lembretes.",
      details: validation.errors
    });
  }

  try {
    const processed = await dispatchPendingReminders(50);
    return res.json({ ok: true, processed });
  } catch (error) {
    console.error("Falha no cron de lembretes:", error);
    return res.status(500).json({
      ok: false,
      error: error.message || "Falha ao processar lembretes."
    });
  }
}

