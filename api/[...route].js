import { initializeDatabase } from "../backend/src/db.js";
import { ensureDefaultServices } from "../backend/src/services/serviceCatalog.js";
import { createApp } from "../backend/src/createApp.js";
import {
  DEFAULT_BARBERSHOP_ID,
  getRuntimeSummary,
  validateRuntimeConfig
} from "../backend/src/config.js";

let appPromise;

function appendQueryParam(searchParams, key, value) {
  if (Array.isArray(value)) {
    value.forEach((item) => appendQueryParam(searchParams, key, item));
    return;
  }

  if (value === undefined) {
    return;
  }

  searchParams.append(key, String(value));
}

function buildExpressUrl(req) {
  const routeParam = req.query?.route;
  const routeSegments = Array.isArray(routeParam)
    ? routeParam.flatMap((segment) => String(segment).split("/").filter(Boolean))
    : typeof routeParam === "string" && routeParam
      ? routeParam.split("/").filter(Boolean)
      : [];

  const queryParams = new URLSearchParams();

  Object.entries(req.query || {}).forEach(([key, value]) => {
    if (key === "route") {
      return;
    }

    appendQueryParam(queryParams, key, value);
  });

  let pathname;

  if (routeSegments.length > 0) {
    pathname = `/${routeSegments.map((segment) => encodeURIComponent(segment)).join("/")}`;
  } else {
    pathname = (req.url || "/").replace(/^\/api/, "") || "/";
  }

  const queryString = queryParams.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

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

async function runExpressApp(app, req, res) {
  await new Promise((resolve, reject) => {
    const cleanup = () => {
      res.off("finish", handleFinish);
      res.off("close", handleClose);
      res.off("error", handleError);
    };

    const handleFinish = () => {
      cleanup();
      resolve();
    };

    const handleClose = () => {
      cleanup();
      resolve();
    };

    const handleError = (error) => {
      cleanup();
      reject(error);
    };

    res.on("finish", handleFinish);
    res.on("close", handleClose);
    res.on("error", handleError);

    app.handle(req, res, (error) => {
      if (error) {
        cleanup();
        reject(error);
        return;
      }

      if (!res.writableEnded) {
        cleanup();
        resolve();
      }
    });
  });
}

export default async function handler(req, res) {
  const originalUrl = req.url;
  req.url = buildExpressUrl(req);

  try {
    const app = await getApp();
    await runExpressApp(app, req, res);
    return;
  } catch (error) {
    console.error("Falha ao inicializar handler do Vercel:", error);
    return res.status(500).json({
      error: "Falha ao inicializar a API."
    });
  } finally {
    req.url = originalUrl;
  }
}
