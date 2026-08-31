import cron from "node-cron";
import { query } from "../db.js";
import { BARBERSHOP_TIMEZONE } from "../config.js";

function getCurrentBarbershopDateTime() {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: BARBERSHOP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(new Date()).map((part) => [part.type, part.value])
  );

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`
  };
}

export function getCurrentSlotReference() {
  return getCurrentBarbershopDateTime();
}

export async function deactivateExpiredOpenSlots() {
  const { date, time } = getCurrentBarbershopDateTime();

  const result = await query(
    `
      UPDATE horarios
      SET disponivel = false
      WHERE data = $1::date
        AND disponivel = true
        AND hora < $2
        AND NOT EXISTS (
          SELECT 1
          FROM agendamentos a
          WHERE a.data = horarios.data
            AND a.hora = horarios.hora
            AND a.barbearia_id = horarios.barbearia_id
            AND a.status != 'cancelado'
        )
    `,
    [date, time]
  );

  return result.rowCount || 0;
}

export function startSlotExpiryMonitor() {
  cron.schedule("* * * * *", async () => {
    try {
      await deactivateExpiredOpenSlots();
    } catch (error) {
      console.error("Falha ao desativar horarios expirados:", error);
    }
  });
}
