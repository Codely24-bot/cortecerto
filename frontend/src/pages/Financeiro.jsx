import { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar.jsx";
import { apiFetch } from "../api.js";

const PAYMENT_STATUS_OPTIONS = [
  { value: "", label: "Todos os pagamentos" },
  { value: "pago", label: "Pago" },
  { value: "pendente", label: "Nao pago" }
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "", label: "Todas as formas" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "Pix" },
  { value: "cartao_debito", label: "Cartao de debito" },
  { value: "cartao_credito", label: "Cartao de credito" },
  { value: "fiado", label: "Fiado" },
  { value: "nao_informado", label: "Nao informado" },
  { value: "outro", label: "Outro" }
];

const PAYMENT_METHOD_LABELS = Object.fromEntries(
  PAYMENT_METHOD_OPTIONS.filter((item) => item.value).map((item) => [item.value, item.label])
);

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatDateBr(value) {
  if (!value) return "--";
  const [year, month, day] = String(value).slice(0, 10).split("-");
  if (!year || !month || !day) return "--";
  return `${day}/${month}/${year}`;
}

function paymentStatusClass(status) {
  return status === "pago"
    ? "status-pill status-pill--pago"
    : "status-pill status-pill--pendente";
}

function getMethodLabel(value) {
  return PAYMENT_METHOD_LABELS[value] || "Nao informado";
}

function buildQueryString(filters) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export default function Financeiro() {
  const [appointments, setAppointments] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [filters, setFilters] = useState({
    dataInicio: "",
    dataFim: "",
    statusPagamento: "",
    metodoPagamento: ""
  });
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadAppointments(currentFilters = filters) {
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch(
        `/financeiro/atendimentos${buildQueryString(currentFilters)}`
      );
      setAppointments(response);
      setDrafts(
        Object.fromEntries(
          response.map((item) => [
            item.id,
            {
              statusPagamento: item.status_pagamento || "pendente",
              metodoPagamento: item.metodo_pagamento || "nao_informado",
              dataPagamento: item.data_pagamento
                ? String(item.data_pagamento).slice(0, 10)
                : ""
            }
          ])
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAppointments(filters);
  }, [filters.dataInicio, filters.dataFim, filters.statusPagamento, filters.metodoPagamento]);

  function updateFilter(key, value) {
    setFilters((current) => ({
      ...current,
      [key]: value
    }));
  }

  function updateDraft(id, key, value) {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...(current[id] || {}),
        [key]: value
      }
    }));
  }

  async function savePayment(item) {
    const draft = drafts[item.id];

    if (!draft) return;

    setSavingId(item.id);
    setError("");
    setSuccess("");

    try {
      await apiFetch(`/financeiro/atendimentos/${item.id}/pagamento`, {
        method: "PUT",
        body: JSON.stringify({
          status: draft.statusPagamento,
          metodo: draft.metodoPagamento || "nao_informado",
          dataPagamento:
            draft.statusPagamento === "pago"
              ? draft.dataPagamento || undefined
              : null
        })
      });
      setSuccess(`Pagamento do atendimento ${item.id} atualizado com sucesso.`);
      await loadAppointments(filters);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  }

  const summary = useMemo(() => {
    const paid = appointments.filter((item) => item.status_pagamento === "pago");
    const pending = appointments.filter((item) => item.status_pagamento !== "pago");
    const fiado = pending.filter((item) => item.metodo_pagamento === "fiado");
    const received = paid.reduce(
      (total, item) => total + Number(item.valor_cobrado || 0),
      0
    );

    return [
      { label: "Atendimentos", value: String(appointments.length) },
      { label: "Pagos", value: String(paid.length) },
      { label: "Nao pagos", value: String(pending.length) },
      { label: "Fiado em aberto", value: String(fiado.length) },
      { label: "Recebido", value: formatCurrency(received) }
    ];
  }, [appointments]);

  return (
    <section className="flex flex-col gap-6">
      <Topbar
        title="Financeiro dos atendimentos"
        subtitle="Pagamentos"
        description="Acompanhe todos os horarios agendados, confira os dados do cliente e registre se cada corte foi pago, evitando fraude, esquecimento e venda fiado sem controle."
      />

      {error ? <p className="alert-error">{error}</p> : null}
      {success ? <p className="alert-success">{success}</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {summary.map((card) => (
          <div key={card.label} className="app-panel metric-card rounded-[1.8rem] p-5">
            <p className="section-kicker">{card.label}</p>
            <h3 className="mt-4 font-display text-2xl font-semibold text-ink">
              {card.value}
            </h3>
          </div>
        ))}
      </div>

      <div className="app-panel rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="font-display text-xl text-ink">Filtros financeiros</h3>
            <p className="mt-2 text-sm text-soft">
              Refine por periodo, status do pagamento e forma usada no caixa.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="flex flex-col gap-2 text-sm text-soft">
              Data inicial
              <input
                className="field-dark"
                type="date"
                value={filters.dataInicio}
                onChange={(event) => updateFilter("dataInicio", event.target.value)}
              />
            </label>

            <label className="flex flex-col gap-2 text-sm text-soft">
              Data final
              <input
                className="field-dark"
                type="date"
                value={filters.dataFim}
                onChange={(event) => updateFilter("dataFim", event.target.value)}
              />
            </label>

            <label className="flex flex-col gap-2 text-sm text-soft">
              Status do pagamento
              <select
                className="field-dark"
                value={filters.statusPagamento}
                onChange={(event) => updateFilter("statusPagamento", event.target.value)}
              >
                {PAYMENT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value || "all-status"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm text-soft">
              Forma de pagamento
              <select
                className="field-dark"
                value={filters.metodoPagamento}
                onChange={(event) => updateFilter("metodoPagamento", event.target.value)}
              >
                {PAYMENT_METHOD_OPTIONS.map((option) => (
                  <option key={option.value || "all-methods"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="app-panel rounded-[2rem] p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-xl text-ink">Controle dos agendamentos</h3>
            <p className="mt-2 text-sm text-soft">
              Todos os clientes agendados com status do atendimento, pagamento e forma de recebimento.
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          {loading ? <p className="text-sm text-soft">Carregando controle financeiro...</p> : null}

          {!loading && !appointments.length ? (
            <p className="text-sm text-soft">Nenhum agendamento encontrado para os filtros atuais.</p>
          ) : null}

          {!loading && appointments.length ? (
            <table className="data-table text-sm">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Hora</th>
                  <th>Cliente</th>
                  <th>Telefone</th>
                  <th>Servico</th>
                  <th>Atendimento</th>
                  <th>Valor</th>
                  <th>Pagamento</th>
                  <th>Forma</th>
                  <th>Data pgto</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((item) => {
                  const draft = drafts[item.id] || {
                    statusPagamento: item.status_pagamento || "pendente",
                    metodoPagamento: item.metodo_pagamento || "nao_informado",
                    dataPagamento: item.data_pagamento
                      ? String(item.data_pagamento).slice(0, 10)
                      : ""
                  };
                  const blocked = item.status === "cancelado";

                  return (
                    <tr key={item.id}>
                      <td>{formatDateBr(item.data)}</td>
                      <td>{item.hora}</td>
                      <td>{item.nome}</td>
                      <td>{item.telefone}</td>
                      <td>{item.servico}</td>
                      <td>
                        <span className={`status-pill ${
                          item.status === "cancelado"
                            ? "status-pill--cancelado"
                            : item.status === "concluido"
                              ? "status-pill--concluido"
                              : "status-pill--confirmado"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td>{formatCurrency(item.valor_cobrado)}</td>
                      <td>
                        <div className="flex flex-col gap-2">
                          <span className={paymentStatusClass(item.status_pagamento)}>
                            {item.status_pagamento === "pago" ? "Pago" : "Nao pago"}
                          </span>
                          <select
                            className="field-dark min-w-[150px] text-sm"
                            value={draft.statusPagamento}
                            onChange={(event) =>
                              updateDraft(item.id, "statusPagamento", event.target.value)
                            }
                            disabled={blocked}
                          >
                            <option value="pago">Pago</option>
                            <option value="pendente">Nao pago</option>
                          </select>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col gap-2">
                          <span className="text-sm text-soft">
                            {getMethodLabel(item.metodo_pagamento)}
                          </span>
                          <select
                            className="field-dark min-w-[170px] text-sm"
                            value={draft.metodoPagamento}
                            onChange={(event) =>
                              updateDraft(item.id, "metodoPagamento", event.target.value)
                            }
                            disabled={blocked}
                          >
                            {PAYMENT_METHOD_OPTIONS.filter((option) => option.value).map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col gap-2">
                          <span className="text-sm text-soft">
                            {formatDateBr(item.data_pagamento)}
                          </span>
                          <input
                            className="field-dark min-w-[150px] text-sm"
                            type="date"
                            value={draft.dataPagamento}
                            onChange={(event) =>
                              updateDraft(item.id, "dataPagamento", event.target.value)
                            }
                            disabled={blocked || draft.statusPagamento !== "pago"}
                          />
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn-gold px-4 py-2"
                          type="button"
                          disabled={blocked || savingId === item.id}
                          onClick={() => savePayment(item)}
                        >
                          {blocked
                            ? "Cancelado"
                            : savingId === item.id
                              ? "Salvando..."
                              : "Salvar"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : null}
        </div>
      </div>
    </section>
  );
}
