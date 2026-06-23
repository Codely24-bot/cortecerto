import { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar.jsx";
import { apiFetch } from "../api.js";

const CHATBOT_QR_URL =
  import.meta.env.VITE_CHATBOT_URL ||
  `${import.meta.env.VITE_API_URL || ""}/qr`;

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function formatDateLabel(date) {
  const [year, month, day] = String(date).slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function getInitialForm(date, serviceName = "Corte") {
  return {
    nome: "",
    telefone: "",
    data: date,
    hora: "07:00",
    servico: serviceName
  };
}

function statusBadgeClass(status) {
  if (status === "cancelado") return "status-pill status-pill--cancelado";
  if (status === "concluido") return "status-pill status-pill--concluido";
  return "status-pill status-pill--confirmado";
}

function AppointmentModal({
  type,
  form,
  onChange,
  onClose,
  onSubmit,
  agendamento,
  servicos,
  saving
}) {
  if (!type) return null;

  const isView = type === "view";
  const isEdit = type === "edit";
  const title = isView
    ? "Cliente agendado"
    : isEdit
      ? "Editar agendamento"
      : "Novo agendamento";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/78 p-4 backdrop-blur-md">
      <div className="app-panel w-full max-w-3xl rounded-[2rem] p-6 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-kicker">Agenda</p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-white">{title}</h2>
            <p className="mt-3 text-sm text-soft">
              {isView
                ? "Consulte os dados do cliente sem sair da agenda."
                : "Preencha os dados abaixo para salvar o agendamento."}
            </p>
          </div>
          <button
            className="btn-ghost px-4 py-2"
            onClick={onClose}
            type="button"
          >
            Fechar
          </button>
        </div>

        {isView ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="app-panel-muted rounded-[1.5rem] p-5">
              <p className="section-kicker">Cliente</p>
              <h3 className="mt-3 font-display text-2xl font-semibold text-white">{agendamento.nome}</h3>
              <p className="mt-2 text-sm text-soft">{agendamento.telefone}</p>
            </div>
            <div className="app-panel-muted rounded-[1.5rem] p-5">
              <p className="section-kicker">Servico</p>
              <h3 className="mt-3 font-display text-2xl font-semibold text-white">{agendamento.servico}</h3>
              <p className="mt-2 text-sm text-soft">
                {formatDateLabel(agendamento.data)} as {agendamento.hora}
              </p>
            </div>
            <div className="app-panel-muted rounded-[1.5rem] p-5">
              <p className="section-kicker">Status</p>
              <span className={`mt-3 inline-flex ${statusBadgeClass(agendamento.status)}`}>
                {agendamento.status}
              </span>
            </div>
            <div className="app-panel-muted rounded-[1.5rem] p-5">
              <p className="section-kicker">Resumo</p>
              <p className="mt-3 text-sm leading-7 text-soft">
                Cliente agendado para {formatDateLabel(agendamento.data)} as {agendamento.hora},
                com servico de {agendamento.servico}.
              </p>
            </div>
          </div>
        ) : (
          <form className="mt-8 grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-soft">Nome do cliente</span>
              <input
                className="field-dark"
                name="nome"
                onChange={onChange}
                required
                type="text"
                value={form.nome}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-soft">Telefone com DDD</span>
              <input
                className="field-dark"
                name="telefone"
                onChange={onChange}
                required
                type="text"
                value={form.telefone}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-soft">Data</span>
              <input
                className="field-dark"
                name="data"
                onChange={onChange}
                required
                type="date"
                value={form.data}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-soft">Hora</span>
              <input
                className="field-dark"
                name="hora"
                onChange={onChange}
                required
                type="time"
                value={form.hora}
              />
            </label>
            <label className="flex flex-col gap-2 md:col-span-2">
              <span className="text-sm font-medium text-soft">Servico</span>
              <select
                className="field-dark"
                name="servico"
                onChange={onChange}
                value={form.servico}
              >
                {servicos.map((item) => (
                  <option key={item.id ?? item.nome} value={item.nome}>
                    {item.nome}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-2 flex flex-wrap gap-3 md:col-span-2">
              <button
                className="btn-gold"
                disabled={saving}
                type="submit"
              >
                {saving ? "Salvando..." : isEdit ? "Salvar alteracoes" : "Criar agendamento"}
              </button>
              <button
                className="btn-ghost"
                onClick={onClose}
                type="button"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function Agenda() {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [agendamentos, setAgendamentos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalType, setModalType] = useState(null);
  const [modalAppointment, setModalAppointment] = useState(null);
  const [form, setForm] = useState(getInitialForm(getToday()));

  const defaultServiceName = useMemo(
    () => servicos[0]?.nome || "Corte",
    [servicos]
  );

  async function loadAgendamentos(date = selectedDate) {
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch(
        `/agendamentos?data=${encodeURIComponent(date)}`
      );
      setAgendamentos(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAgendamentos();
  }, [selectedDate]);

  useEffect(() => {
    async function loadServicos() {
      try {
        const response = await apiFetch("/servicos");
        setServicos(response);
      } catch (err) {
        setError(err.message);
      }
    }

    loadServicos();
  }, []);

  function closeModal() {
    setModalType(null);
    setModalAppointment(null);
    setForm(getInitialForm(selectedDate, defaultServiceName));
  }

  function openNewAppointmentModal() {
    setForm(getInitialForm(selectedDate, defaultServiceName));
    setModalAppointment(null);
    setModalType("create");
  }

  function openEditModal(agendamento) {
    setForm({
      nome: agendamento.nome,
      telefone: agendamento.telefone,
      data: formatDate(agendamento.data),
      hora: agendamento.hora,
      servico: agendamento.servico
    });
    setModalAppointment(agendamento);
    setModalType("edit");
  }

  function openViewModal(agendamento) {
    setModalAppointment(agendamento);
    setModalType("view");
  }

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleModalSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      if (modalType === "create") {
        await apiFetch("/agendar", {
          method: "POST",
          body: JSON.stringify(form)
        });
        setSuccess(`Agendamento criado para ${formatDateLabel(form.data)} as ${form.hora}.`);
      }

      if (modalType === "edit" && modalAppointment) {
        await apiFetch(`/agendamento/${modalAppointment.id}`, {
          method: "PUT",
          body: JSON.stringify(form)
        });
        setSuccess(`Agendamento ${modalAppointment.id} atualizado com sucesso.`);
      }

      setSelectedDate(form.data);
      closeModal();
      await loadAgendamentos(form.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(agendamento) {
    const confirmed = window.confirm(
      `Deseja cancelar o agendamento de ${agendamento.nome} as ${agendamento.hora}?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await apiFetch(`/agendamento/${agendamento.id}`, {
        method: "DELETE"
      });
      setSuccess(`Agendamento ${agendamento.id} cancelado.`);
      await loadAgendamentos();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleComplete(agendamento) {
    const confirmed = window.confirm(
      `Confirmar que o atendimento de ${agendamento.nome} foi finalizado?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await apiFetch(`/agendamento/${agendamento.id}/concluir`, {
        method: "POST"
      });
      setSuccess(
        `Atendimento finalizado e mensagem de agradecimento enviada para ${agendamento.nome}.`
      );
      await loadAgendamentos();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <Topbar
        title="Agenda diaria"
        subtitle="Agendamentos"
        description="Controle atendimentos, abra o QR do WhatsApp e administre os clientes com a mesma linguagem visual da nova marca."
      />
      {error ? <p className="alert-error">{error}</p> : null}
      {success ? <p className="alert-success">{success}</p> : null}

      <AppointmentModal
        agendamento={modalAppointment}
        form={form}
        onChange={handleFormChange}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
        saving={saving}
        servicos={servicos.length ? servicos : [{ id: "default", nome: defaultServiceName }]}
        type={modalType}
      />

      <div className="app-panel rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3">
            <p className="text-sm text-soft">
              Visualizacao em tempo real da agenda.
            </p>
            <input
              className="field-dark max-w-[220px]"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="btn-ghost"
              onClick={() => window.open(CHATBOT_QR_URL, "_blank", "noopener,noreferrer")}
              type="button"
            >
              Gerar QR do WhatsApp
            </button>
            <a
              className="text-xs text-faint underline-offset-4 hover:text-white hover:underline"
              href={CHATBOT_QR_URL}
              target="_blank"
              rel="noreferrer"
            >
              Abrir QR em nova aba
            </a>
            <button
              className="btn-gold"
              onClick={openNewAppointmentModal}
              type="button"
            >
              Novo agendamento
            </button>
          </div>
        </div>
        <div className="app-panel-muted mt-5 rounded-[1.4rem] px-4 py-3">
          <p className="text-sm text-soft">
            Servicos disponiveis para faturamento:{" "}
            {servicos.length ? servicos.map((item) => item.nome).join(", ") : "carregando..."}
          </p>
        </div>
        <div className="mt-6 overflow-x-auto">
          {loading ? <p className="text-sm text-soft">Carregando agenda...</p> : null}
          {!loading && !agendamentos.length ? (
            <p className="text-sm text-soft">Nenhum agendamento para esta data.</p>
          ) : null}
          {!loading && agendamentos.length ? (
            <table className="data-table text-sm">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Cliente</th>
                  <th>Servico</th>
                  <th>Status</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {agendamentos.map((row) => (
                  <tr key={row.id}>
                    <td>{row.hora}</td>
                    <td>{row.nome}</td>
                    <td>{row.servico}</td>
                    <td>
                      <span className={statusBadgeClass(row.status)}>{row.status}</span>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                      {row.status !== "concluido" && row.status !== "cancelado" ? (
                        <button
                          className="btn-success px-3 py-2"
                          onClick={() => handleComplete(row)}
                          type="button"
                        >
                          Finalizar
                        </button>
                      ) : null}
                      <button
                        className="btn-ghost px-3 py-2"
                        onClick={() => openEditModal(row)}
                        type="button"
                      >
                        Editar
                      </button>
                      <button
                        className="btn-danger px-3 py-2"
                        onClick={() => handleCancel(row)}
                        type="button"
                      >
                        Cancelar
                      </button>
                      <button
                        className="btn-dark px-3 py-2"
                        onClick={() => openViewModal(row)}
                        type="button"
                      >
                        Ver cliente
                      </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      </div>
    </section>
  );
}
