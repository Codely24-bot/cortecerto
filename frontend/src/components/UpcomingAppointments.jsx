import { Link } from "react-router-dom";
import { Clock, ArrowRight } from "lucide-react";

function serviceTone(service) {
  if ((service || "").includes("Corte + Barba")) return "pill-purple";
  if (service === "Barba") return "pill-red";
  return "pill-blue";
}

function Avatar({ name }) {
  const initial = name.charAt(0);
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1a63d4] to-[#1250b8] font-display text-sm font-bold text-white shadow-[0_6px_14px_rgba(17,85,204,0.4)]">
      {initial}
    </div>
  );
}

export default function UpcomingAppointments({ items = [], loading = false }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <div>
          <p className="kicker">Agenda</p>
          <h3 className="mt-1 font-display text-lg font-semibold text-white">Próximos horários</h3>
        </div>
        <Link to="/agenda" className="btn btn-ghost px-3 py-2 text-xs">
          Ver agenda <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-5 flex flex-1 flex-col gap-3">
        {loading ? (
          <p className="text-sm text-muted">Carregando...</p>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 p-6 text-center">
            <Clock className="h-6 w-6 text-muted" />
            <p className="text-sm text-muted">Nenhum horário por hoje.</p>
          </div>
        ) : (
          items.map((a) => (
            <div key={`${a.hora}-${a.nome}-${a.id || ""}`} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 p-3 transition hover:bg-white/6">
              <Avatar name={a.nome} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-white">{a.nome}</p>
                <p className="truncate text-xs text-muted capitalize">{a.status}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="flex items-center gap-1 text-xs font-semibold text-[#7fb2ff]">
                  <Clock className="h-3.5 w-3.5" /> {a.hora}
                </span>
                <span className={`pill ${serviceTone(a.servico)}`}>{a.servico}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <button className="btn btn-primary mt-4 w-full">Ver todos os agendamentos</button>
    </div>
  );
}
