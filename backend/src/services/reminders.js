import cron from "node-cron";
import {
  listPendingReminders,
  markReminderSent
} from "./reminderScheduler.js";

export async function dispatchPendingReminders(limit = 50) {
  const reminders = await listPendingReminders(limit);

  for (const reminder of reminders) {
    await markReminderSent(reminder.id);
  }

  return reminders.length;
}

export function startReminders() {
  cron.schedule("*/5 * * * *", async () => {
    await dispatchPendingReminders(50);
  });
}
