import { useEffect, useState, useCallback } from "react";
import Layout from "../components/Layout.jsx";
import MetricCard from "../components/MetricCard.jsx";
import ScheduleCalendar from "../components/ScheduleCalendar.jsx";
import UpcomingAppointments from "../components/UpcomingAppointments.jsx";
import RevenueChart from "../components/RevenueChart.jsx";
import { api, todayIso, isoDaysAgo, isoDaysAhead, formatBRL } from "../api.js";
import { CalendarCheck2, Banknote, Users, TrendingUp, RotateCw } from "lucide-react";

const WEEKDAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function todayLabel() {
  const d = new Date();
  const base = d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  return `${base.charAt(0).toUpperCase()}${base.slice(1)}`;
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [agendamentos, setAgendamentos] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [m, ag, ho, rev] = await Promise.all([
        api.metricas(),
        api.agendamentos(todayIso()),
        api.horarios(isoDaysAgo(7), isoDaysAhead(21)),
        api.faturamentoSemanal()
      ]);
      setMetrics(m);
      setAgendamentos(ag);
      setHorarios(ho);
      const now = new Date();
      setRevenue(
        rev.map((r) => {
          const d = new Date(`${r.data}T12:00:00`);
          return { label: WEEKDAY_NAMES[d.getDay()], value: Number(r.valor) || 0 };
        })
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [refreshKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <Layout title="Bom dia, Barbearia do João" subtitle={todayLabel()}>
      <div className="flex flex-col gap-6">
        {error ? (
          <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-[#ff8f97]">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            label="Agendamentos hoje"
            value={loading ? "..." : String(metrics?.agendamentosHoje ?? 0)}
            hint={loading ? "Carregando" : `${metrics?.concluidosHoje ?? 0} concluídos hoje`}
            icon={CalendarCheck2}
            tone="primary"
          />
          <MetricCard
            label="Faturamento do dia"
            value={loading ? "..." : formatBRL(metrics?.faturamentoHoje ?? 0)}
            hint={loading ? "Carregando" : `Mês: ${formatBRL(metrics?.faturamentoMes ?? 0)}`}
            icon={Banknote}
            tone="gold"
          />
          <MetricCard
            label="Clientes atendidos"
            value={loading ? "..." : String(metrics?.clientesAtivos ?? 0)}
            hint="Cadastrados no sistema"
            icon={Users}
            tone="red"
          />
        </div>

        <div className="flex items-center justify-end">
          <button className="btn btn-ghost px-3 py-2 text-xs" onClick={refresh} disabled={loading}>
            <RotateCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Atualizar
          </button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <div className="panel min-w-0 p-5 md:p-6">
            <ScheduleCalendar
              agendamentos={agendamentos}
              horarios={horarios}
              loading={loading}
              onGenerateWeek={() => {
                api.gerarSemana(todayIso()).then(() => setRefreshKey((k) => k + 1));
              }}
              onGoToday={() => setRefreshKey((k) => k + 1)}
            />
          </div>
          <div className="panel p-5 md:p-6">
            <UpcomingAppointments items={agendamentos} loading={loading} />
          </div>
        </div>

        <div className="panel p-5 md:p-6">
          <RevenueChart data={revenue} />
        </div>

        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          <div className="card flex items-center gap-4 p-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-[#7fb2ff]">
              <TrendingUp className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm text-muted">Faturamento do mês</p>
              <p className="font-display text-lg font-bold text-white">
                {loading ? "..." : formatBRL(metrics?.faturamentoMes ?? 0)}
              </p>
            </div>
          </div>
          <div className="card flex items-center gap-4 p-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger/15 text-[#ff8f97]">
              <Users className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm text-muted">Cancelados hoje</p>
              <p className="font-display text-lg font-bold text-white">
                {loading ? "..." : String(metrics?.canceladosHoje ?? 0)}
              </p>
            </div>
          </div>
          <div className="card flex items-center gap-4 p-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
              <CalendarCheck2 className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm text-muted">Semana passada</p>
              <p className="font-display text-lg font-bold text-white">—</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
