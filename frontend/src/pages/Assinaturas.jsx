import { useEffect, useState } from "react";
import Topbar from "../components/Topbar.jsx";
import { apiFetch } from "../api.js";

const defaultSubscriberForm = {
  nome: "",
  telefone: "",
  planoId: "",
  statusPagamento: "pendente",
  observacoes: ""
};

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatDate(value) {
  const [year, month, day] = String(value || "").slice(0, 10).split("-");
  if (!year || !month || !day) return "";
  return `${day}/${month}/${year}`;
}

function paymentStatusClass(status) {
  if (status === "pago") return "status-pill status-pill--pago";
  if (status === "atrasado") return "status-pill status-pill--atrasado";
  if (status === "cancelado") return "status-pill status-pill--cancelado";
  return "status-pill status-pill--pendente";
}

export default function Assinaturas() {
  const [summary, setSummary] = useState(null);
  const [plan, setPlan] = useState(null);
  const [clients, setClients] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [subscriberForm, setSubscriberForm] = useState(defaultSubscriberForm);
  const [loading, setLoading] = useState(true);
  const [savingSubscriber, setSavingSubscriber] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData(currentStatus = statusFilter) {
    setLoading(true);
    setError("");

    try {
      const [summaryResponse, plansResponse, clientsResponse] = await Promise.all([
        apiFetch("/assinaturas/resumo"),
        apiFetch("/assinaturas/planos"),
        apiFetch(
          `/assinaturas/clientes${
            currentStatus ? `?status=${encodeURIComponent(currentStatus)}` : ""
          }`
        )
      ]);

      const activePlan = plansResponse[0] || null;
      setSummary(summaryResponse);
      setPlan(activePlan);
      setClients(clientsResponse);
      setSubscriberForm((current) => ({
        ...current,
        planoId: activePlan ? String(activePlan.id) : ""
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(statusFilter);
  }, [statusFilter]);

  async function handleCreateSubscriber(event) {
    event.preventDefault();
    setSavingSubscriber(true);
    setError("");
    setSuccess("");

    try {
      await apiFetch("/assinaturas/clientes", {
        method: "POST",
        body: JSON.stringify({
          nome: subscriberForm.nome,
          telefone: subscriberForm.telefone,
          planoId: Number(subscriberForm.planoId),
          statusPagamento: subscriberForm.statusPagamento,
          observacoes: subscriberForm.observacoes || undefined
        })
      });
      setSubscriberForm((current) => ({
        ...defaultSubscriberForm,
        planoId: current.planoId
      }));
      setSuccess("Assinante cadastrado com sucesso.");
      await loadData(statusFilter);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingSubscriber(false);
    }
  }

  async function handleRegisterPayment(client) {
    const competencia = window.prompt("Competencia do pagamento (ex.: 2026-03):");
    if (!competencia) return;

    const valor = window.prompt("Valor pago:", String(client.plano_valor || ""));
    if (!valor) return;

    setError("");
    setSuccess("");

    try {
      await apiFetch(`/assinaturas/clientes/${client.id}/pagamentos`, {
        method: "POST",
        body: JSON.stringify({
          competencia,
          valor: Number(valor),
          status: "pago"
        })
      });
      setSuccess(`Pagamento registrado para ${client.nome}.`);
      await loadData(statusFilter);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRegisterCut(client) {
    setError("");
    setSuccess("");

    try {
      await apiFetch(`/assinaturas/clientes/${client.id}/consumos`, {
        method: "POST",
        body: JSON.stringify({
          descricao: "Corte",
          quantidade: 1
        })
      });
      setSuccess(`Consumo de corte registrado para ${client.nome}.`);
      await loadData(statusFilter);
    } catch (err) {
      setError(err.message);
    }
  }

  const cards = [
    { label: "Assinantes ativos", value: summary?.total_ativos || 0 },
    { label: "Pagamentos em dia", value: summary?.pagamentos_em_dia || 0 },
    { label: "Vencendo na semana", value: summary?.vencendo_semana || 0 },
    {
      label: "Receita mensal prevista",
      value: formatCurrency(summary?.receita_recorrente || 0)
    }
  ];

  return (
    <section className="flex flex-col gap-6">
      <Topbar
        title="Assinaturas e cortes mensais"
        subtitle="Recorrencia"
        description="Gerencie mensalistas, pagamentos e consumo de cortes em uma area refinada para acompanhar previsibilidade de caixa."
      />

      {error ? <p className="alert-error">{error}</p> : null}
      {success ? <p className="alert-success">{success}</p> : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="app-panel metric-card rounded-[1.8rem] p-6">
            <p className="section-kicker">{card.label}</p>
            <h3 className="mt-5 font-display text-3xl font-semibold text-white">
              {card.value}
            </h3>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="app-panel rounded-[2rem] p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-display text-xl text-white">Mensalistas</h3>
              <p className="mt-2 text-sm text-soft">
                Acompanhe cliente, vencimento, status de pagamento e consumo de cortes.
              </p>
            </div>
            <select
              className="field-dark max-w-[220px]"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">Todos os status</option>
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
              <option value="atrasado">Atrasado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          {loading ? <p className="mt-6 text-sm text-soft">Carregando assinaturas...</p> : null}
          {!loading && !clients.length ? (
            <p className="mt-6 text-sm text-soft">Nenhum assinante encontrado.</p>
          ) : null}

          {!loading && clients.length ? (
            <div className="mt-6 overflow-x-auto">
              <table className="data-table text-sm">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Assinatura</th>
                    <th>Vencimento</th>
                    <th>Pagamento</th>
                    <th>Cortes</th>
                    <th>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id}>
                      <td>
                        <p className="text-white">{client.nome}</p>
                        <p className="text-xs text-faint">{client.telefone}</p>
                      </td>
                      <td>
                        <p>{client.plano_nome}</p>
                        <p className="text-xs text-faint">{formatCurrency(client.plano_valor)}</p>
                      </td>
                      <td>{formatDate(client.data_vencimento)}</td>
                      <td>
                        <span className={paymentStatusClass(client.status_pagamento)}>
                          {client.status_pagamento}
                        </span>
                      </td>
                      <td>
                        <p>Usados: {client.cortes_usados_mes}</p>
                        <p className="text-xs text-faint">
                          Restantes: {client.cortes_restantes}
                        </p>
                      </td>
                      <td>
                        <div className="flex flex-col gap-2">
                          <button
                            className="btn-gold px-3 py-2"
                            type="button"
                            onClick={() => handleRegisterPayment(client)}
                          >
                            Registrar pagamento
                          </button>
                          <button
                            className="btn-ghost px-3 py-2"
                            type="button"
                            onClick={() => handleRegisterCut(client)}
                          >
                            Registrar corte
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>

        <div className="app-panel rounded-[2rem] p-6 md:p-8">
          <h3 className="font-display text-xl text-white">Novo assinante</h3>
          <div className="app-panel-muted mt-4 rounded-[1.5rem] px-5 py-4">
            <p className="section-kicker">Plano ativo</p>
            <p className="mt-3 font-display text-2xl text-white">
              {plan ? `${plan.nome} - ${formatCurrency(plan.valor)}` : "R$ 159,99"}
            </p>
            <p className="mt-2 text-sm text-soft">
              {plan
                ? `${plan.cortes_inclusos} cortes inclusos a cada ${plan.validade_dias} dias.`
                : "Assinatura mensal fixa."}
            </p>
          </div>

          <form className="mt-6 flex flex-col gap-4" onSubmit={handleCreateSubscriber}>
            <input
              className="field-dark"
              placeholder="Nome do cliente"
              value={subscriberForm.nome}
              onChange={(event) =>
                setSubscriberForm((current) => ({ ...current, nome: event.target.value }))
              }
            />
            <input
              className="field-dark"
              placeholder="Telefone"
              value={subscriberForm.telefone}
              onChange={(event) =>
                setSubscriberForm((current) => ({
                  ...current,
                  telefone: event.target.value
                }))
              }
            />
            <select
              className="field-dark"
              value={subscriberForm.statusPagamento}
              onChange={(event) =>
                setSubscriberForm((current) => ({
                  ...current,
                  statusPagamento: event.target.value
                }))
              }
            >
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
              <option value="atrasado">Atrasado</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <textarea
              className="field-dark min-h-24"
              placeholder="Observacoes"
              value={subscriberForm.observacoes}
              onChange={(event) =>
                setSubscriberForm((current) => ({
                  ...current,
                  observacoes: event.target.value
                }))
              }
            />
            <button
              className="btn-gold"
              disabled={savingSubscriber || !subscriberForm.planoId}
            >
              {savingSubscriber ? "Salvando..." : "Cadastrar assinante"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
