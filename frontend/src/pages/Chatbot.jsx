import { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import { MessageCircle, Send, CheckCircle2, Clock3, Sparkles } from "lucide-react";
import { api } from "../api.js";

export default function Chatbot() {
  const [status, setStatus] = useState(null);
  const online = status?.status === "external";

  useEffect(() => {
    api.chatbotStatus().then(setStatus).catch(() => {});
  }, []);

  const quickStats = [
    { label: "Conversas hoje", value: online ? "Ativo" : "Inativo", icon: MessageCircle, tone: "text-[#25D366]", bg: "bg-[#25D366]/15" },
    { label: "Agendamentos pelo bot", value: 9, icon: CheckCircle2, tone: "text-emerald-300", bg: "bg-emerald-500/15" },
    { label: "Tempo médio de resposta", value: "12s", icon: Clock3, tone: "text-[#7fb2ff]", bg: "bg-primary/15" }
  ];

  return (
    <Layout title="Chatbot" subtitle="Assistente virtual no WhatsApp">
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="card flex items-center gap-4 p-5">
            <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${quickStats[0].bg} ${quickStats[0].tone}`}>
              <MessageCircle className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm text-muted">Conversas hoje</p>
              <p className="font-display text-2xl font-bold text-white">{quickStats[0].value}</p>
            </div>
          </div>
          <div className="card flex items-center gap-4 p-5">
            <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${quickStats[1].bg} ${quickStats[1].tone}`}>
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm text-muted">Agendamentos pelo bot</p>
              <p className="font-display text-2xl font-bold text-white">{quickStats[1].value}</p>
            </div>
          </div>
          <div className="card flex items-center gap-4 p-5">
            <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${quickStats[2].bg} ${quickStats[2].tone}`}>
              <Clock3 className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm text-muted">Tempo médio de resposta</p>
              <p className="font-display text-2xl font-bold text-white">{quickStats[2].value}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <div className="panel flex flex-col p-5 md:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="kicker">Conversa ao vivo</p>
                <h3 className="mt-1 font-display text-lg font-semibold text-white">Simulação de atendimento</h3>
              </div>
              <span className={`pill ${online ? "pill-green" : "pill-red"}`}>
                {online ? <span className="blink-dot h-2 w-2 rounded-full bg-emerald-400" /> : null}
                {online ? "Online" : "Offline"}
              </span>
            </div>

            <div className="mb-5 flex flex-1 flex-col gap-3 rounded-2xl border border-white/8 bg-black/20 p-4" style={{ minHeight: "300px" }}>
              {chatbotMessages.map((m, i) =>
                m.from === "bot" ? (
                  <div key={i} className="max-w-[75%] self-start rounded-2xl rounded-tl-sm border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-slate-200">
                    {m.text}
                  </div>
                ) : (
                  <div key={i} className="max-w-[75%] self-end rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-white">
                    <p className="mb-0.5 text-xs font-semibold text-[#bfd9ff]">{m.name}</p>
                    {m.text}
                  </div>
                )
              )}
            </div>

            <div className="flex items-center gap-2">
              <input className="field flex-1" placeholder="Digite uma mensagem de teste..." />
              <button className="btn btn-success px-4 py-3"><Send className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="card p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#25D366]/20">
                <Sparkles className="h-6 w-6 text-[#25D366]" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-white">Configurações do bot</h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Atendimento automático</span>
                  <span className={`pill ${online ? "pill-green" : "pill-red"}`}>{online ? "Ligado" : "Desligado"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Confirmar agendamentos</span>
                  <span className="pill pill-green">Ligado</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Notificação de ausência</span>
                  <span className="pill pill-red">Desligado</span>
                </div>
              </div>
              <button className="btn btn-ghost mt-5 w-full">Abrir configurações</button>
            </div>

            <div className="card p-6">
              <h3 className="font-display text-lg font-semibold text-white">Número conectado</h3>
              <p className="mt-2 text-sm text-muted">WhatsApp Business principal</p>
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366]/20 text-[#25D366]">
                  <MessageCircle className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">+55 (11) 99999-0000</p>
                  <p className="text-xs text-emerald-300">Conectado</p>
                </div>
              </div>
              <button className="btn btn-danger-ghost mt-4 w-full">Desconectar número</button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
