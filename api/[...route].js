import { initializeDatabase } from "../backend/src/db.js";
import { ensureDefaultServices } from "../backend/src/services/serviceCatalog.js";
import { createApp } from "../backend/src/createApp.js";
import {
  DEFAULT_BARBERSHOP_ID,
  getRuntimeSummary,
  validateRuntimeConfig
} from "../backend/src/config.js";

let appPromise;

async function bootstrapApp() {
  const validation = validateRuntimeConfig();
  const runtimeSummary = getRuntimeSummary();

  validation.warnings.forEach((warning) => {
    console.warn("Aviso de configuracao:", warning);
  });

  if (!validation.valid) {
    validation.errors.forEach((error) => {
      console.error("Erro de configuracao:", error);
    });
    throw new Error("Configuracao invalida para inicializar a API no Vercel.");
  }

  console.log("Resumo de inicializacao:", runtimeSummary);
  await initializeDatabase();
  await ensureDefaultServices(DEFAULT_BARBERSHOP_ID);
  return createApp({ includeFrontend: false, enableChatbot: false });
}

async function getApp() {
  if (!appPromise) {
    appPromise = bootstrapApp().catch((error) => {
      appPromise = undefined;
      throw error;
    });
  }

  return appPromise;
}

export default async function handler(req, res) {
  const originalUrl = req.url;
  req.url = req.url.replace(/^\/api/, "") || "/";

  try {
    const app = await getApp();
    return app(req, res);
  } catch (error) {
    console.error("Falha ao inicializar handler do Vercel:", error);
    return res.status(500).json({
      error: "Falha ao inicializar a API."
    });
  } finally {
    req.url = originalUrl;
  }
}

