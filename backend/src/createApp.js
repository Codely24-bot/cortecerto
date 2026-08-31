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
import { getChatbotPublicUrl } from "./config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");

function registerDisabledChatbotRoutes(application) {
  const chatbotPublicUrl = getChatbotPublicUrl();
  const externalQrUrl = chatbotPublicUrl ? `${chatbotPublicUrl}/qr` : "";
  const externalQrImageUrl = chatbotPublicUrl ? `${chatbotPublicUrl}/qr.png` : "";
  const payload = {
    status: chatbotPublicUrl ? "external" : "disabled",
    qrPagePath: chatbotPublicUrl ? externalQrUrl : "/qr",
    qrImagePath: chatbotPublicUrl ? externalQrImageUrl : "/qr.png",
    updatedAt: null,
    message: chatbotPublicUrl
      ? "Chatbot disponivel em servico externo."
      : "Chatbot desativado neste ambiente."
  };

  application.get("/chatbot/status", (req, res) => {
    res.json(payload);
  });

  application.get("/qr.png", (req, res) => {
    if (externalQrImageUrl) {
      return res.redirect(307, externalQrImageUrl);
    }

    res.status(404).json(payload);
  });

  application.get("/qr", (req, res) => {
    if (externalQrUrl) {
      return res.redirect(307, externalQrUrl);
    }

    res.type("html").send(`<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Chatbot indisponivel</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background: #f6f3ee;
        color: #1f2937;
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
      }
      main {
        width: min(100%, 520px);
        background: #fffdf8;
        border-radius: 20px;
        padding: 28px;
        box-shadow: 0 18px 40px rgba(31, 41, 55, 0.12);
        text-align: center;
      }
      p {
        line-height: 1.6;
        color: #4b5563;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Chatbot indisponivel</h1>
      <p>O modulo do WhatsApp esta desativado neste ambiente de deploy.</p>
      <p>Se desejar usa-lo, habilite <strong>CHATBOT_ENABLED=true</strong> em um ambiente compativel.</p>
    </main>
  </body>
</html>`);
  });
}

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
      req.path.startsWith("/chatbot") ||
      req.path.startsWith("/webhook") ||
      req.path === "/health" ||
      req.path === "/qr" ||
      req.path === "/qr.png"
    ) {
      return next();
    }

    return res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

export async function createApp({
  includeFrontend = false,
  enableChatbot = false
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

  if (enableChatbot) {
    try {
      const chatbotModule = await import("../../chatbot/robo.js");
      const { initializeChatbot, registerChatbotRoutes } = chatbotModule.default;
      registerChatbotRoutes(app);
      initializeChatbot().catch((error) => {
        console.error("Falha ao iniciar chatbot integrado:", error);
      });
    } catch (error) {
      console.error("Falha ao carregar chatbot integrado:", error);
      registerDisabledChatbotRoutes(app);
    }
  } else {
    registerDisabledChatbotRoutes(app);
  }

  if (includeFrontend) {
    registerFrontendRoutes(app);
  }

  app.use(errorHandler);
  return app;
}
