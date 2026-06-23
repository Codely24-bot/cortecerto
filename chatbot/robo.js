const http = require("http");
const path = require("path");
const qrcode = require("qrcode-terminal");
const QRCode = require("qrcode");
const { Client, LocalAuth } = require("whatsapp-web.js");

const getApiUrl = () => process.env.API_URL || "http://localhost:4000";
const getBarbeariaId = () => process.env.BARBEARIA_ID || "default";
const getBarbeariaNome = () => process.env.BARBEARIA_NOME || "MESTRE DA NAVALHA";
const getAdminPass = () => process.env.ADMIN_PASS || "";
const PORT = Number(process.env.PORT) || 3000;
const PAUSA_PROPRIETARIO_MS = 5 * 60 * 1000;

let ultimoQr = null;
let qrDataUrl = null;
let qrPngBuffer = null;
let qrAtualizadoEm = null;
let botConectado = false;
let chatbotInicializado = false;
let chatbotInitializationPromise = null;

const sessions = new Map();
const antiSpam = new Map();
const pausasProprietario = new Map();

const horariosRegex = /^\d{2}:\d{2}$/;
const dataRegex = /^\d{4}-\d{2}-\d{2}$/;

const servicosPadrao = ["Corte", "Barba", "Corte + Barba", "Pintura", "Sobrancelha"];

const authPath = path.join(__dirname, ".wwebjs_auth");

const escapeHtml = (valor = "") =>
  valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: authPath
  }),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--single-process"
    ]
  }
});

const headersSemCache = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
  "Surrogate-Control": "no-store"
};

const normalizarTexto = (texto) =>
  texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const telefoneDoChat = (chatId = "") => chatId.replace(/\D/g, "");
const formatarDataBr = (data = "") => {
  const [ano, mes, dia] = String(data).slice(0, 10).split("-");
  if (!ano || !mes || !dia) return data;
  return `${dia}/${mes}/${ano}`;
};

const menuPrincipal = () =>
  `👋 Ola! Seja bem-vindo(a) a ${getBarbeariaNome()}\n\n1 . 📅 Agendar horario\n2 . ❌ Cancelar agendamento\n3 . 💎 Me tornar assinante\n4 . 💬 Falar com atendente`;

const resetSession = (session) => {
  session.step = "menu";
  session.data = null;
  session.hora = null;
  session.nome = null;
  session.telefone = null;
  session.servico = null;
  session.diaVencimentoAssinatura = null;
  session.servicosDisponiveis = null;
  session.diasDisponiveis = null;
  session.horariosDisponiveis = null;
  session.agendamentosCancelamento = null;
};

async function obterServicosDisponiveis() {
  try {
    const servicos = await apiAdminRequest(
      `/servicos?barbeariaId=${encodeURIComponent(getBarbeariaId())}`
    );

    if (Array.isArray(servicos) && servicos.length) {
      return servicos.map((servico) => servico.nome);
    }
  } catch (error) {
    console.log("Falha ao carregar servicos do catalogo:", error.message);
  }

  return servicosPadrao;
}

const mapearServico = (texto, original, servicosDisponiveis) => {
  const lista = servicosDisponiveis?.length ? servicosDisponiveis : servicosPadrao;
  const indiceEscolhido = Number(texto);

  if (Number.isInteger(indiceEscolhido) && lista[indiceEscolhido - 1]) {
    return lista[indiceEscolhido - 1];
  }

  const servicoEncontrado = lista.find(
    (servico) => normalizarTexto(servico) === texto
  );

  return servicoEncontrado || original;
};

const getStatusPayload = () => ({
  status: ultimoQr ? "qr_disponivel" : botConectado ? "conectado" : "aguardando_qr",
  qrPagePath: "/qr",
  qrImagePath: "/qr.png",
  updatedAt: qrAtualizadoEm
});

const renderQrPage = () => {
  if (qrDataUrl) {
    return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="refresh" content="15" />
    <title>QR Code WhatsApp</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f4efe6;
        --card: #fffdf8;
        --text: #1f2937;
        --muted: #6b7280;
        --accent: #1d9b5f;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background:
          radial-gradient(circle at top, #fff7df 0, transparent 35%),
          linear-gradient(180deg, #f8f1e7 0%, var(--bg) 100%);
        font-family: Arial, sans-serif;
        color: var(--text);
        padding: 24px;
      }
      main {
        width: min(100%, 560px);
        background: var(--card);
        border-radius: 24px;
        padding: 24px;
        box-shadow: 0 18px 40px rgba(31, 41, 55, 0.12);
        text-align: center;
      }
      img {
        width: min(100%, 420px);
        height: auto;
        background: #fff;
        border-radius: 18px;
        padding: 16px;
      }
      h1 {
        margin: 0 0 8px;
        font-size: 28px;
      }
      p {
        margin: 0 0 12px;
        color: var(--muted);
        line-height: 1.5;
      }
      .status {
        display: inline-block;
        margin-top: 16px;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(29, 155, 95, 0.12);
        color: var(--accent);
        font-size: 14px;
        font-weight: bold;
      }
      code {
        display: block;
        margin-top: 16px;
        word-break: break-all;
        color: var(--muted);
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Escaneie o QR Code</h1>
      <p>Abra esta pagina e escaneie no WhatsApp Web.</p>
      <img src="${qrDataUrl || ""}" alt="QR Code do WhatsApp" />
      <div class="status">Atualizado em: ${escapeHtml(qrAtualizadoEm || "")}</div>
      <code>/qr.png</code>
    </main>
  </body>
</html>`;
  }

  if (botConectado) {
    return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="refresh" content="20" />
    <title>WhatsApp Conectado</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background:
          radial-gradient(circle at top, #e8fff2 0, transparent 35%),
          linear-gradient(180deg, #effaf3 0%, #e5f7eb 100%);
        font-family: Arial, sans-serif;
        padding: 24px;
        text-align: center;
        color: #14532d;
      }
      main {
        max-width: 480px;
        background: #fcfffd;
        border-radius: 24px;
        padding: 28px;
        box-shadow: 0 18px 40px rgba(20, 83, 45, 0.12);
      }
      .status {
        display: inline-block;
        margin-top: 12px;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(22, 163, 74, 0.14);
        color: #15803d;
        font-size: 14px;
        font-weight: bold;
      }
      p {
        color: #166534;
        line-height: 1.5;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>WhatsApp conectado</h1>
      <p>O bot ja esta autenticado.</p>
      <div class="status">Atualizado em: ${escapeHtml(qrAtualizadoEm || new Date().toISOString())}</div>
    </main>
  </body>
</html>`;
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="refresh" content="10" />
    <title>QR Code WhatsApp</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #f4efe6;
        font-family: Arial, sans-serif;
        padding: 24px;
        text-align: center;
        color: #1f2937;
      }
      main {
        max-width: 480px;
        background: #fffdf8;
        border-radius: 24px;
        padding: 24px;
        box-shadow: 0 18px 40px rgba(31, 41, 55, 0.12);
      }
      p {
        color: #6b7280;
        line-height: 1.5;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Aguardando QR Code</h1>
      <p>Assim que o WhatsApp gerar um novo QR, esta pagina exibe a imagem.</p>
    </main>
  </body>
</html>`;
};

const readBody = (req) =>
  new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => resolve(data));
  });

async function apiRequest(pathname, method = "GET", body, extraHeaders = {}) {
  const response = await fetch(`${getApiUrl()}${pathname}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Erro na API");
  }

  return response.json();
}

async function apiAdminRequest(pathname, method = "GET", body) {
  const adminPass = getAdminPass();

  if (!adminPass) {
    throw new Error("ADMIN_PASS nao configurado no chatbot.");
  }

  return apiRequest(pathname, method, body, {
    Authorization: `Bearer ${adminPass}`
  });
}

async function buscarAgendamentosAtivosPorTelefone(telefone) {
  const agendamentos = await apiAdminRequest(
    `/agendamentos?barbeariaId=${encodeURIComponent(getBarbeariaId())}`
  );

  return agendamentos.filter(
    (agendamento) =>
      telefoneDoChat(agendamento.telefone) === telefone &&
      agendamento.status !== "cancelado"
  );
}

async function handleWebhookPayload(payload) {
  if (!payload?.data?.telefone) {
    return { ok: true };
  }

  const numero = payload.data.telefone.replace(/\D/g, "");
  const chatId = `${numero}@c.us`;
  const texto = payload.data.texto
    ? payload.data.texto
    : payload.data.lembrete
    ? `⏰ Lembrete: seu horario esta agendado para hoje, as ${payload.data.hora}.`
    : `✅ Seu agendamento foi confirmado para ${payload.data.data} as ${payload.data.hora}.`;

  await client.sendMessage(chatId, texto);
  return { ok: true };
}

async function handleIncomingMessage(msg) {
  if (!msg.from) return;
  if (msg.from === "status@broadcast") return;
  if (msg.from.endsWith("@g.us")) return;
  if (msg.fromMe) return;
  if (!msg.body) return;

  const agora = Date.now();
  const ultimo = antiSpam.get(msg.from) || 0;
  if (agora - ultimo < 2500) return;
  antiSpam.set(msg.from, agora);

  const chat = await msg.getChat();
  if (chat.isGroup) return;

  const textoOriginal = msg.body.trim();
  const texto = normalizarTexto(textoOriginal);
  const pausaAtivaAte = pausasProprietario.get(msg.from);

  if (pausaAtivaAte && pausaAtivaAte > agora) {
    return;
  }

  if (pausaAtivaAte && pausaAtivaAte <= agora) {
    pausasProprietario.delete(msg.from);
  }

  if (!sessions.has(msg.from)) {
    sessions.set(msg.from, { step: "menu" });
  }

  const session = sessions.get(msg.from);

  const typing = async () => {
    await chat.sendStateTyping();
    await delay(1000);
  };

  const enviarMenu = async () => {
    await typing();
    await client.sendMessage(msg.from, menuPrincipal());
  };

  if (["cancelar", "menu", "oi", "ola", "agenda", "agendar"].includes(texto)) {
    resetSession(session);
    await enviarMenu();
    return;
  }

  if (session.step === "menu") {
    if (texto === "1") {
      const diasDisponiveis = await apiRequest(
        `/dias-disponiveis?barbeariaId=${encodeURIComponent(getBarbeariaId())}`
      );

      if (!diasDisponiveis.length) {
        await typing();
        await client.sendMessage(
          msg.from,
          "Informamos que nao ha horarios livres nesta semana. Tente novamente mais tarde ou fale com o proprietario."
        );
        return;
      }

      session.step = "agendar_dia";
      session.diasDisponiveis = diasDisponiveis;
      await typing();
        await client.sendMessage(
          msg.from,
          `📅 Selecione um dia disponivel:\n\n${diasDisponiveis
            .map(
              (dia, index) =>
              `${index + 1} . ${formatarDataBr(dia.data)} (${dia.disponiveis} horarios livres)`
            )
            .join("\n")}`
        );
      return;
    }

    if (texto === "2") {
      const telefone = telefoneDoChat(msg.from);
      const agendamentos = await buscarAgendamentosAtivosPorTelefone(telefone);

      if (!agendamentos.length) {
        await typing();
        await client.sendMessage(
          msg.from,
          "📭 Nao localizei agendamentos ativos para este numero. Se desejar, envie *menu* para voltar ao inicio."
        );
        return;
      }

      session.step = "cancelar_escolha";
      session.agendamentosCancelamento = agendamentos;
      await typing();
      await client.sendMessage(
        msg.from,
        `🗓️ Selecione o numero do agendamento que deseja cancelar:\n\n${agendamentos
          .map(
            (agendamento, index) =>
              `${index + 1} . ${formatarDataBr(agendamento.data)} as ${agendamento.hora} - ${agendamento.servico}`
          )
          .join("\n")}`
      );
      return;
    }
    if (texto === "3") {
      session.step = "assinatura_vencimento";
      await typing();
      await client.sendMessage(
        msg.from,
        `💎 *Plano Assinatura Mensal*\n\n✂️ 1 corte por semana via agendamentos\n💰 Valor mensal de R$ 159,99\n📆 Voce escolhe o melhor dia do vencimento\n\nSe quiser seguir, me responda com um numero de 1 a 28 informando o dia do vencimento que prefere.`
      );
      return;
    }

    if (texto === "4") {
      pausasProprietario.set(msg.from, agora + PAUSA_PROPRIETARIO_MS);
      resetSession(session);
      await typing();
      await client.sendMessage(
        msg.from,
        "💬 Perfeito. O atendimento automatico sera pausado por 5 minutos para que um atendente possa assumir esta conversa."
      );
      return;
    }

    await enviarMenu();
    return;
  }

  if (session.step === "agendar_dia") {
    const numeroEscolhido = Number(texto);
    const dia = session.diasDisponiveis?.[numeroEscolhido - 1];

    if (!Number.isInteger(numeroEscolhido) || !dia) {
      await typing();
      await client.sendMessage(
        msg.from,
        "⚠️ Opcao invalida. Selecione um dos dias da lista para continuar."
      );
      return;
    }

    session.data = dia.data;
    const horarios = await apiRequest(
      `/horarios-disponiveis?data=${encodeURIComponent(dia.data)}&barbeariaId=${encodeURIComponent(getBarbeariaId())}`
    );

    if (!horarios.length) {
      await typing();
      await client.sendMessage(
        msg.from,
        "Este dia ficou indisponivel no momento. Por favor, escolha outra data."
      );
      session.step = "menu";
      session.diasDisponiveis = null;
      await enviarMenu();
      return;
    }

    session.horariosDisponiveis = horarios;
    session.step = "agendar_hora";
    await typing();
    await client.sendMessage(
      msg.from,
      `🕐 Horarios disponiveis para ${formatarDataBr(dia.data)}:\n\n${horarios
        .map((hora, index) => `${index + 1} . ${hora}`)
        .join("\n")}`
    );
    return;
  }

  if (session.step === "agendar_hora") {
    const numeroEscolhido = Number(texto);
    const horaEscolhida = session.horariosDisponiveis?.[numeroEscolhido - 1];

    if (!Number.isInteger(numeroEscolhido) || !horaEscolhida) {
      await typing();
      await client.sendMessage(
        msg.from,
        "⚠️ Opcao invalida. Selecione um dos horarios da lista."
      );
      return;
    }

    session.hora = horaEscolhida;
    session.step = "agendar_nome";
    await typing();
    await client.sendMessage(msg.from, "📝 Por favor, informe seu nome completo.");
    return;
  }

  if (session.step === "agendar_nome") {
    session.nome = textoOriginal;
    session.telefone = telefoneDoChat(msg.from);
    session.servicosDisponiveis = await obterServicosDisponiveis();
    session.step = "agendar_servico";
    await typing();
    await client.sendMessage(
      msg.from,
      `✂️ Informe o servico desejado:\n${session.servicosDisponiveis
        .map((servico, index) => `${index + 1} . ${servico}`)
        .join("\n")}`
    );
    return;
  }

  if (session.step === "agendar_servico") {
    session.servico = mapearServico(
      texto,
      textoOriginal,
      session.servicosDisponiveis
    );
    const payload = {
      barbeariaId: getBarbeariaId(),
      nome: session.nome,
      telefone: session.telefone,
      data: session.data,
      hora: session.hora,
      servico: session.servico
    };

    const agendamento = await apiRequest("/agendar", "POST", payload);
    resetSession(session);
    await typing();
    await client.sendMessage(
      msg.from,
      `✅ Agendamento confirmado para ${formatarDataBr(agendamento.data)} as ${agendamento.hora}.\n🙏 Agradecemos pelas informacoes. Seu horario foi reservado com sucesso.`
    );
    await enviarMenu();
    return;
  }

  if (session.step === "assinatura_vencimento") {
    const diaEscolhido = Number(texto);

    if (!Number.isInteger(diaEscolhido) || diaEscolhido < 1 || diaEscolhido > 28) {
      await typing();
      await client.sendMessage(
        msg.from,
        "⚠️ Opcao invalida. Me envie um numero de 1 a 28 para informar o dia do vencimento que voce prefere."
      );
      return;
    }

    session.diaVencimentoAssinatura = diaEscolhido;
    pausasProprietario.set(msg.from, agora + PAUSA_PROPRIETARIO_MS);
    resetSession(session);
    await typing();
    await client.sendMessage(
      msg.from,
      `💎 Perfeito! Anotei seu interesse na *Assinatura Mensal* de R$ 159,99 com 1 corte por semana via agendamentos.\n\n📆 Dia de vencimento desejado: ${diaEscolhido}\n\n💬 Agora vou pausar o atendimento automatico por 5 minutos para um atendente continuar seu cadastro.`
    );
    return;
  }

  if (session.step === "cancelar_escolha") {
    const numeroEscolhido = Number(texto);
    const agendamento = session.agendamentosCancelamento?.[numeroEscolhido - 1];

    if (!Number.isInteger(numeroEscolhido) || !agendamento) {
      await typing();
      await client.sendMessage(
        msg.from,
        "⚠️ Opcao invalida. Selecione um dos numeros da lista para cancelar o agendamento."
      );
      return;
    }

    await apiAdminRequest(`/agendamento/${agendamento.id}`, "DELETE");
    resetSession(session);
    await typing();
    await client.sendMessage(
      msg.from,
      `❌ Agendamento cancelado com sucesso: ${formatarDataBr(agendamento.data)} as ${agendamento.hora}.`
    );
    await enviarMenu();
  }
}

async function atualizarQrImagem(qr) {
  ultimoQr = qr;
  qrAtualizadoEm = new Date().toISOString();

  try {
    const opcoesQr = {
      errorCorrectionLevel: "H",
      margin: 2,
      scale: 12,
      width: 420,
      type: "image/png"
    };

    qrDataUrl = await QRCode.toDataURL(qr, opcoesQr);
    qrPngBuffer = await QRCode.toBuffer(qr, opcoesQr);
  } catch (erro) {
    qrDataUrl = null;
    qrPngBuffer = null;
    console.log("Erro ao gerar QR:", erro);
  }
}

function attachClientEvents() {
  client.on("qr", (qr) => {
    console.log("Escaneie o QR Code:");
    qrcode.generate(qr, { small: false });
  });

  client.on("qr", atualizarQrImagem);

  client.on("ready", () => {
    botConectado = true;
    ultimoQr = null;
    qrDataUrl = null;
    qrPngBuffer = null;
    qrAtualizadoEm = new Date().toISOString();
    console.log("BOT ONLINE COM SUCESSO");
  });

  client.on("disconnected", (reason) => {
    botConectado = false;
    ultimoQr = null;
    qrDataUrl = null;
    qrPngBuffer = null;
    console.log("WhatsApp desconectado:", reason);
  });

  client.on("message", async (msg) => {
    try {
      await handleIncomingMessage(msg);
    } catch (erro) {
      console.log("ERRO:", erro);
    }
  });
}

attachClientEvents();

function initializeChatbot() {
  if (chatbotInicializado) {
    return chatbotInitializationPromise;
  }

  chatbotInicializado = true;
  chatbotInitializationPromise = client.initialize().catch((erro) => {
    chatbotInicializado = false;
    chatbotInitializationPromise = null;
    throw erro;
  });

  return chatbotInitializationPromise;
}

function registerChatbotRoutes(app) {
  app.get("/qr.png", (req, res) => {
    if (!qrPngBuffer) {
      res.set(headersSemCache);
      return res
        .status(404)
        .json({ status: botConectado ? "conectado" : "aguardando_qr" });
    }

    res.set(headersSemCache);
    res.set("Content-Type", "image/png");
    return res.send(qrPngBuffer);
  });

  app.get("/qr", (req, res) => {
    res.set(headersSemCache);
    res.type("html");
    return res.send(renderQrPage());
  });

  app.post("/webhook", async (req, res) => {
    try {
      const payload = req.body || {};
      const resposta = await handleWebhookPayload(payload);
      return res.json(resposta);
    } catch (erro) {
      console.log("ERRO WEBHOOK:", erro);
      return res.status(500).json({ error: "Falha ao enviar mensagem pelo chatbot" });
    }
  });

  app.get("/chatbot/status", (req, res) => {
    res.set(headersSemCache);
    return res.json(getStatusPayload());
  });
}

async function handleStandaloneRequest(req, res) {
  if (req.url === "/qr.png") {
    if (!qrPngBuffer) {
      res.writeHead(404, {
        ...headersSemCache,
        "Content-Type": "application/json; charset=utf-8"
      });
      res.end(
        JSON.stringify({ status: botConectado ? "conectado" : "aguardando_qr" })
      );
      return;
    }

    res.writeHead(200, {
      ...headersSemCache,
      "Content-Type": "image/png",
      "Content-Length": qrPngBuffer.length
    });
    res.end(qrPngBuffer);
    return;
  }

  if (req.url === "/qr") {
    res.writeHead(200, {
      ...headersSemCache,
      "Content-Type": "text/html; charset=utf-8"
    });
    res.end(renderQrPage());
    return;
  }

  if (req.url === "/webhook" && req.method === "POST") {
    try {
      const body = await readBody(req);
      const payload = JSON.parse(body || "{}");
      const resposta = await handleWebhookPayload(payload);
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(resposta));
    } catch (erro) {
      console.log("ERRO WEBHOOK:", erro);
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "Falha ao enviar mensagem pelo chatbot" }));
    }
    return;
  }

  res.writeHead(200, {
    ...headersSemCache,
    "Content-Type": "application/json; charset=utf-8"
  });
  res.end(JSON.stringify(getStatusPayload()));
}

module.exports = {
  initializeChatbot,
  registerChatbotRoutes
};

if (require.main === module) {
  const servidor = http.createServer((req, res) => {
    handleStandaloneRequest(req, res).catch((erro) => {
      console.log("ERRO:", erro);
      res.writeHead(500, {
        "Content-Type": "application/json; charset=utf-8"
      });
      res.end(JSON.stringify({ error: "Falha interna do chatbot" }));
    });
  });

  servidor.listen(PORT, () => {
    console.log(`Painel do QR ativo na porta ${PORT}. Use /qr para abrir a imagem.`);
  });

  initializeChatbot().catch((erro) => {
    console.log("Falha ao iniciar chatbot:", erro);
  });
}
