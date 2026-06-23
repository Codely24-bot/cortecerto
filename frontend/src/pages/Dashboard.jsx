import { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar.jsx";
import { apiFetch } from "../api.js";

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function buildShare(value, max) {
  if (!max) return 10;
  return Math.max(12, Math.round((value / max) * 100));
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [subscriptionSummary, setSubscriptionSummary] = useState(null);
  const [freeSlots, setFreeSlots] = useState(0);
  const [totalClients, setTotalClients] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      const today = getToday();
      setError("");

      try {
        const [resumo, agendamentos, horariosDisponiveis, assinaturas] = await Promise.all([
          apiFetch(`/relatorios/resumo?data=${encodeURIComponent(today)}`),
          apiFetch(`/agendamentos?data=${encodeURIComponent(today)}`),
          apiFetch(`/horarios-disponiveis?data=${encodeURIComponent(today)}`),
          apiFetch("/assinaturas/resumo")
        ]);

        setSummary(resumo);
        setSubscriptionSummary(assinaturas);
        setFreeSlots(horariosDisponiveis.length);
        setTotalClients(new Set(agendamentos.map((item) => item.telefone)).size);
      } catch (err) {
        setError(err.message);
      }
    }

    loadDashboard();
  }, []);

  const cards = [
    {
      label: "Faturamento estimado",
      value: formatCurrency(summary?.faturamento_estimado || 0),
      note: `${summary?.confirmados || 0} confirmados hoje`
    },
    {
      label: "Agendamentos do dia",
      value: String(summary?.total || 0),
      note: `${summary?.concluidos || 0} concluidos`
    },
    {
      label: "Novos clientes",
      value: String(totalClients),
      note: `${freeSlots} horarios livres`
    },
    {
      label: "Receita recorrente",
      value: formatCurrency(subscriptionSummary?.receita_recorrente || 0),
      note: `${subscriptionSummary?.total_ativos || 0} assinantes ativos`
    }
  ];

  const performanceItems = useMemo(() => {
    const items = [
      { label: "Clientes atendidos", value: totalClients },
      { label: "Horarios livres", value: freeSlots },
      { label: "Assinantes ativos", value: subscriptionSummary?.total_ativos || 0 },
      { label: "Pagamentos em dia", value: subscriptionSummary?.pagamentos_em_dia || 0 }
    ];
    const max = Math.max(...items.map((item) => Number(item.value || 0)), 1);

    return items.map((item) => ({
      ...item,
      width: buildShare(Number(item.value || 0), max)
    }));
  }, [freeSlots, subscriptionSummary, totalClients]);

  const statusItems = [
    { label: "Confirmados", value: summary?.confirmados || 0, className: "status-pill--confirmado" },
    { label: "Concluidos", value: summary?.concluidos || 0, className: "status-pill--concluido" },
    { label: "Cancelados", value: summary?.cancelados || 0, className: "status-pill--cancelado" },
    { label: "Pendentes", value: subscriptionSummary?.pagamentos_pendentes || 0, className: "status-pill--pendente" }
  ];

  const upcomingRenewals = subscriptionSummary?.vencimentos_proximos || [];

  return (
    <section className="flex flex-col gap-6">
      <Topbar
        title="Dashboard executivo"
        subtitle="Operacao central"
        description="Indicadores, recorrencia, agenda e leitura rapida do caixa em uma superficie inspirada na nova identidade da marca."
      />

      {error ? <p className="alert-error">{error}</p> : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="app-panel metric-card rounded-[1.8rem] p-6">
            <p className="section-kicker">{card.label}</p>
            <h3 className="mt-5 font-display text-3xl font-semibold text-white">
              {card.value}
            </h3>
            <p className="mt-4 text-sm text-soft">{card.note}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="app-panel rounded-[2rem] p-6 md:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="section-kicker">Leitura operacional</p>
              <h3 className="mt-3 font-display text-2xl font-semibold text-white">
                Pulso da barbearia
              </h3>
            </div>
            <p className="text-sm text-soft">
              Indicadores normalizados para comparacao rapida entre agenda, base ativa e recorrencia.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="space-y-5">
              {performanceItems.map((item) => (
                <div key={item.label} className="app-panel-muted rounded-[1.4rem] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-soft">{item.label}</p>
                    <p className="font-semibold text-white">{item.value}</p>
                  </div>
                  <div className="bar-track mt-4">
                    <div className="bar-fill" style={{ width: `${item.width}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="app-panel-muted rounded-[1.6rem] p-5">
              <p className="section-kicker">Resumo financeiro</p>
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-soft">Faturamento bruto</span>
                  <strong className="text-white">
                    {formatCurrency(summary?.faturamento_estimado || 0)}
                  </strong>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-soft">Receita recorrente</span>
                  <strong className="text-[#f2c86b]">
                    {formatCurrency(subscriptionSummary?.receita_recorrente || 0)}
                  </strong>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-soft">Clientes distintos hoje</span>
                  <strong className="text-white">{totalClients}</strong>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-soft">Capacidade restante</span>
                  <strong className="text-white">{freeSlots} horarios</strong>
                </div>
              </div>

              <div className="gold-divider my-6" />

              <div className="grid gap-3 sm:grid-cols-2">
                {statusItems.map((item) => (
                  <div key={item.label} className="rounded-[1.2rem] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-4">
                    <p className="text-sm text-soft">{item.label}</p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="font-display text-2xl font-semibold text-white">
                        {item.value}
                      </p>
                      <span className={`status-pill ${item.className}`}>{item.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="app-panel rounded-[2rem] p-6">
            <p className="section-kicker">Relacionamento</p>
            <h3 className="mt-3 font-display text-2xl font-semibold text-white">
              Proximos vencimentos
            </h3>
            <div className="mt-6 space-y-4">
              {upcomingRenewals.length ? (
                upcomingRenewals.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[1.4rem] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.025)] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-white">{item.nome}</p>
                        <p className="mt-1 text-sm text-soft">{item.plano_nome}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-faint">
                          vence em {String(item.data_vencimento).slice(0, 10)}
                        </p>
                      </div>
                      <span className="status-pill status-pill--pendente">
                        {item.status_pagamento}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-soft">Nenhum assinante com vencimento proximo.</p>
              )}
            </div>
          </div>

          <div className="app-panel rounded-[2rem] p-6">
            <p className="section-kicker">Assinaturas</p>
            <h3 className="mt-3 font-display text-2xl font-semibold text-white">
              Recorrencia ativa
            </h3>
            <div className="mt-6 grid gap-4">
              <div className="app-panel-muted rounded-[1.4rem] p-4">
                <p className="text-sm text-soft">Pagamentos em dia</p>
                <p className="mt-2 font-display text-3xl text-white">
                  {subscriptionSummary?.pagamentos_em_dia || 0}
                </p>
              </div>
              <div className="app-panel-muted rounded-[1.4rem] p-4">
                <p className="text-sm text-soft">Pagamentos pendentes</p>
                <p className="mt-2 font-display text-3xl text-white">
                  {subscriptionSummary?.pagamentos_pendentes || 0}
                </p>
              </div>
              <div className="app-panel-muted rounded-[1.4rem] p-4">
                <p className="text-sm text-soft">Pagamentos atrasados</p>
                <p className="mt-2 font-display text-3xl text-white">
                  {subscriptionSummary?.pagamentos_atrasados || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
