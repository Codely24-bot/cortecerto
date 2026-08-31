import { useMemo } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, CalendarPlus } from "lucide-react";
import { todayIso } from "../api.js";

function pad(n) {
  return String(n).padStart(2, "0");
}

function dateToLabel(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  const names = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const [y, m, day] = dateStr.split("-");
  return {
    weekday: names[d.getDay()],
    date: `${pad(day)}/${pad(m)}`
  };
}

function colorFor(service = "") {
  const s = service.toLowerCase();
  if (s.includes("barba") && s.includes("corte")) return "appt-combo";
  if (s.includes("barba")) return "appt-barba";
  return "appt-corte";
}

export default function ScheduleCalendar({
  agendamentos = [],
  horarios = [],
  loading = false,
  onGenerateWeek,
  onGoToday
}) {
  const columns = useMemo(() => {
    const dateSet = new Set(horarios.map((h) => String(h.data).slice(0, 10)));
    const dates = [...dateSet].sort();
    return dates.map((date) => {
      const slots = horarios.filter((h) => String(h.data).slice(0, 10) === date);
      const booked = slots.filter((h) => h.disponivel === false).length;
      const available = slots.filter((h) => h.disponivel === true).length;
      const appts = agendamentos
        .filter((a) => String(a.data).slice(0, 10) === date)
        .sort((a, b) => String(a.hora).localeCompare(String(b.hora)));
      return { date, ...dateToLabel(date), slots, booked, available, appts };
    });
  }, [agendamentos, horarios]);

  const hasSlots = columns.length > 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost px-3 py-2" onClick={onGoToday}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button className="btn btn-primary px-4 py-2" onClick={onGoToday}>
            <CalendarDays className="h-4 w-4" /> Hoje
          </button>
          <button className="btn btn-ghost px-3 py-2" onClick={onGoToday}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <p className="font-display text-lg font-semibold text-white">Semana atual</p>
      </div>

      {!hasSlots && !loading ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/15 px-6 py-12 text-center">
          <CalendarPlus className="h-10 w-10 text-muted" />
          <div>
            <p className="font-display text-lg font-semibold text-white">Nenhum horário gerado</p>
            <p className="mt-1 text-sm text-muted">Gere a semana para liberar os horários de atendimento.</p>
          </div>
          {onGenerateWeek ? (
            <button className="btn btn-primary" onClick={onGenerateWeek}>
              <CalendarPlus className="h-4 w-4" /> Gerar semana
            </button>
          ) : null}
        </div>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="grid min-w-max grid-cols-[70px_repeat(7,minmax(128px,1fr))] gap-2">
            <div />
            {Array.from({ length: 7 }).map((_, i) => {
              const col = columns[i];
              const isToday = col && col.date === todayIso();
              return (
                <div
                  key={i}
                  className={`rounded-xl border px-2 py-2 text-center ${
                    isToday ? "border-primary/70 bg-primary/15" : "border-white/10 bg-white/5"
                  }`}
                >
                  {col ? (
                    <>
                      <p className={`text-xs font-semibold uppercase ${isToday ? "text-[#7fb2ff]" : "text-muted"}`}>
                        {col.weekday}
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-white">{col.date}</p>
                    </>
                  ) : (
                    <p className="text-xs text-muted/50">—</p>
                  )}
                </div>
              );
            })}

            <div className="flex items-center justify-end pr-3 text-xs font-semibold text-muted">
              08:00
            </div>
            {columns.length
              ? columns.slice(0, 7).map((col) => (
                  <div key={col.date} className="sched-day flex min-h-[180px] flex-col gap-1.5 p-1.5">
                    {col.appts.length ? (
                      col.appts.map((a) => (
                        <div key={a.id || `${a.hora}-${a.nome}`} className={`appt-block ${colorFor(a.servico)}`}>
                          <span>{a.hora}</span>
                          <span className="truncate">{a.servico}</span>
                          <span className="truncate font-normal opacity-90">{a.nome}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
                        <span className="text-[11px] text-muted/60">{col.available} livres</span>
                      </div>
                    )}
                  </div>
                ))
              : Array.from({ length: 7 }).map((_, i) => (
                  <div key={`empty-${i}`} className="sched-day min-h-[180px]" />
                ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-5">
        <span className="kicker">Legenda</span>
        <span className="pill pill-blue"><span className="h-2.5 w-2.5 rounded-full bg-primary" /> Corte</span>
        <span className="pill pill-red"><span className="h-2.5 w-2.5 rounded-full bg-danger" /> Barba</span>
        <span className="pill pill-purple"><span className="h-2.5 w-2.5 rounded-full bg-violet-500" /> Corte + Barba</span>
      </div>
    </div>
  );
}
