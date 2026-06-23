import cron from "node-cron";
import { sendChatbotTextMessage } from "../integrations/chatbotAdapter.js";
import {
  listPendingReminders,
  markReminderError,
  markReminderSent
} from "./reminderScheduler.js";

export async function dispatchPendingReminders(limit = 50) {
  const reminders = await listPendingReminders(limit);

  for (const reminder of reminders) {
    try {
      const response = await sendChatbotTextMessage({
        telefone: reminder.telefone,
        texto: reminder.mensagem
      });

      if (response?.ok || response?.skipped) {
        await markReminderSent(reminder.id);
      } else {
        await markReminderError(reminder.id, "Falha ao enviar lembrete pelo webhook.");
      }
    } catch (error) {
      await markReminderError(reminder.id, error.message || "Erro desconhecido");
    }
  }

  return reminders.length;
}

export function startReminders() {
  cron.schedule("*/5 * * * *", async () => {
    await dispatchPendingReminders(50);
  });
}
