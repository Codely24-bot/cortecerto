import { Link } from "react-router-dom";
import { MessageCircle, ArrowRight, CheckCircle2 } from "lucide-react";

export default function ChatbotStatus({ status = null, loading = false }) {
  const online = status?.status === "external";
  return (
    <div className="card relative flex h-full flex-col gap-4 overflow-hidden p-6">
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#25D366]/10 blur-2xl" />
      <div className="flex items-center justify-between">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#25D366]/20 shadow-[0_10px_24px_rgba(37,211,102,0.3)]">
          <MessageCircle className="h-7 w-7 text-[#25D366]" fill="currentColor" />
        </div>
        <span className={`pill ${online ? "pill-green" : "pill-red"}`}>
          <span className={`${online ? "blink-dot" : ""} h-2 w-2 rounded-full ${online ? "bg-emerald-400" : "bg-danger"}`} />
          {loading ? "..." : online ? "Online" : "Offline"}
        </span>
      </div>

      <div>
        <h3 className="font-display text-xl font-bold text-white">
          {loading ? "Carregando..." : online ? "Chatbot ativo" : "Chatbot offline"}
        </h3>
        <p className="mt-1 text-sm text-muted">
          {online ? "Respondendo clientes automaticamente" : "Atendimento automático desativado neste ambiente"}
        </p>
      </div>

      <ul className="space-y-2 text-sm text-slate-300">
        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#25D366]" /> Consulta de horários</li>
        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#25D366]" /> Criação de agendamentos</li>
        <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#25D366]" /> Resposta automática 24h</li>
      </ul>

      <Link to="/chatbot" className="btn btn-success mt-auto w-full">
        Abrir painel do chatbot <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
