import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import horariosRoutes from "./routes/horarios.js";
import agendamentosRoutes from "./routes/agendamentos.js";
import adminRoutes from "./routes/admin.js";
import relatoriosRoutes from "./routes/relatorios.js";
import { attachAuthContext } from "./middleware/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import servicosRoutes from "./routes/servicos.js";
import assinaturasRoutes from "./routes/assinaturas.js";
import financeiroRoutes from "./routes/financeiro.js";
import clientesRoutes from "./routes/clientes.js";
import { checkDatabaseConnection, getDatabaseStatus } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");

function registerFrontendRoutes(application) {
  application.use(express.static(frontendDistPath));

  application.get("*", (req, res, next) => {
    if (
      req.path.startsWith("/auth") ||
      req.path.startsWith("/horarios") ||
      req.path.startsWith("/agendar") ||
      req.path.startsWith("/agendamento") ||
      req.path.startsWith("/agendamentos") ||
      req.path.startsWith("/relatorios") ||
      req.path.startsWith("/servicos") ||
      req.path.startsWith("/assinaturas") ||
      req.path === "/health"
    ) {
      return next();
    }

    return res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

export async function createApp({
  includeFrontend = false
} = {}) {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(attachAuthContext);

  app.get("/health", async (req, res) => {
    const status = getDatabaseStatus();

    try {
      await checkDatabaseConnection();
    } catch (error) {
      return res.status(503).json({
        ok: false,
        database: getDatabaseStatus()
      });
    }

    return res.json({
      ok: true,
      database: {
        ...status,
        ready: true,
        error: null
      }
    });
  });

  app.use(adminRoutes);
  app.use(horariosRoutes);
  app.use(agendamentosRoutes);
  app.use(relatoriosRoutes);
  app.use(servicosRoutes);
  app.use(assinaturasRoutes);
  app.use(financeiroRoutes);
  app.use(clientesRoutes);

  if (includeFrontend) {
    registerFrontendRoutes(app);
  }

  app.use(errorHandler);
  return app;
}
