import dotenv from "dotenv";
import { startReminders } from "./services/reminders.js";
import { startSlotExpiryMonitor } from "./services/slotExpiry.js";
import { ensureDefaultServices } from "./services/serviceCatalog.js";
import {
  initializeDatabase
} from "./db.js";
import {
  DEFAULT_BARBERSHOP_ID,
  getRuntimeSummary,
  validateRuntimeConfig
} from "./config.js";
import { createApp } from "./createApp.js";

dotenv.config();

async function bootstrap() {
  const validation = validateRuntimeConfig();
  const runtimeSummary = getRuntimeSummary();

  validation.warnings.forEach((warning) => {
    console.warn("Aviso de configuracao:", warning);
  });

  if (!validation.valid) {
    validation.errors.forEach((error) => {
      console.error("Erro de configuracao:", error);
    });
    throw new Error("Configuracao invalida para inicializar o backend.");
  }

  console.log("Resumo de inicializacao:", runtimeSummary);
  await initializeDatabase();
  await ensureDefaultServices(DEFAULT_BARBERSHOP_ID);
  startReminders();
  startSlotExpiryMonitor();
  const app = await createApp({
    includeFrontend: true
  });

  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`API rodando na porta ${port}`);
    console.log(`Banco conectado e schema validado para a barbearia ${DEFAULT_BARBERSHOP_ID}.`);
  });
}

bootstrap().catch((error) => {
  console.error("Falha ao iniciar servidor:", error);
  process.exit(1);
});
