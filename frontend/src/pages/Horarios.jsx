import { useEffect, useState } from "react";
import Topbar from "../components/Topbar.jsx";
import { apiFetch } from "../api.js";

const slots = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00"
];

function formatDate(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function formatDateLabel(date) {
  const [year, month, day] = String(date).slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getWeekEnd(start) {
  const base = new Date(`${start}T00:00:00`);
  const end = new Date(base);
  end.setDate(base.getDate() + 6);
  return formatDate(end);
}

function groupByDate(horarios) {
  return horarios.reduce((accumulator, horario) => {
    const key = String(horario.data).slice(0, 10);
    if (!accumulator[key]) {
      accumulator[key] = [];
    }
    accumulator[key].push(horario);
    return accumulator;
  }, {});
}

export default function Horarios() {
  const [manualForm, setManualForm] = useState({
    data: getToday(),
    hora: "07:00"
  });
  const [weekStart, setWeekStart] = useState(getToday());
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingDate, setDeletingDate] = useState("");

  async function loadHorarios() {
    setLoading(true);
    setError("");

    try {
      const dataFinal = getWeekEnd(weekStart);
      const response = await apiFetch(
        `/horarios?dataInicial=${encodeURIComponent(weekStart)}&dataFinal=${encodeURIComponent(dataFinal)}`
      );
      setHorarios(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHorarios();
  }, [weekStart]);

  async function handleGenerateWeek() {
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiFetch("/horarios/gerar-semana", {
        method: "POST",
        body: JSON.stringify({ dataInicial: weekStart })
      });
      setSuccess(`Semana gerada com ${response.inserted} novos horarios.`);
      await loadHorarios();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleManualCreate(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await apiFetch("/horarios", {
        method: "POST",
        body: JSON.stringify(manualForm)
      });
      setSuccess(`Horario criado para ${formatDateLabel(manualForm.data)} as ${manualForm.hora}.`);
      await loadHorarios();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleAvailability(horario, disponivel) {
    setUpdatingId(horario.id);
    setError("");
    setSuccess("");

    try {
      await apiFetch(`/horarios/${horario.id}/disponibilidade`, {
        method: "PUT",
        body: JSON.stringify({ disponivel })
      });
      setSuccess(
        `Horario ${formatDateLabel(horario.data)} as ${horario.hora} marcado como ${
          disponivel ? "disponivel" : "indisponivel"
        }.`
      );
      await loadHorarios();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDeleteDate(date) {
    const confirmed = window.confirm(
      `Excluir todos os horarios do dia ${formatDateLabel(date)}? Esta acao nao remove agendamentos ja existentes.`
    );

    if (!confirmed) return;

    setDeletingDate(date);
    setError("");
    setSuccess("");

    try {
      const response = await apiFetch(`/horarios?data=${encodeURIComponent(date)}`, {
        method: "DELETE"
      });
      setSuccess(
        `Dia ${formatDateLabel(date)} excluido com ${response.removidos || 0} horario(s) removido(s).`
      );
      await loadHorarios();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingDate("");
    }
  }

  const grouped = groupByDate(horarios);

  return (
    <section className="flex flex-col gap-6">
      <Topbar
        title="Gestao de horarios"
        subtitle="Disponibilidade"
        description="Monte a semana, abra horarios extras e controle disponibilidade sem fugir da nova linguagem premium do produto."
      />
      {error ? <p className="alert-error">{error}</p> : null}
      {success ? <p className="alert-success">{success}</p> : null}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="app-panel rounded-[2rem] p-6 md:p-8">
          <h3 className="font-display text-xl text-white">Agenda semanal automatica</h3>
          <p className="mt-2 text-sm text-soft">
            Gere horarios de terca a sabado, das 07:00 as 19:00, com pausa de 12:00 a 14:00.
          </p>
          <div className="mt-6 flex flex-col gap-4">
            <label className="text-sm text-soft">
              Inicio da semana
              <input
                className="field-dark mt-2"
                type="date"
                value={weekStart}
                onChange={(event) => setWeekStart(event.target.value)}
              />
            </label>
            <div className="flex flex-wrap gap-3">
              {slots.map((slot) => (
                <span
                  key={slot}
                  className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-sm text-soft"
                >
                  {slot}
                </span>
              ))}
            </div>
            <button
              className="btn-gold mt-2"
              onClick={handleGenerateWeek}
              type="button"
              disabled={submitting}
            >
              {submitting ? "Gerando..." : "Gerar semana"}
            </button>
          </div>
        </div>
        <div className="app-panel rounded-[2rem] p-6 md:p-8">
          <h3 className="font-display text-xl text-white">Criar horario manual</h3>
          <form className="flex flex-col gap-4 mt-6" onSubmit={handleManualCreate}>
            <input
              className="field-dark"
              placeholder="Data (YYYY-MM-DD)"
              type="date"
              value={manualForm.data}
              onChange={(event) =>
                setManualForm((current) => ({ ...current, data: event.target.value }))
              }
            />
            <input
              className="field-dark"
              placeholder="Hora (HH:MM)"
              type="time"
              value={manualForm.hora}
              onChange={(event) =>
                setManualForm((current) => ({ ...current, hora: event.target.value }))
              }
            />
            <button className="btn-gold" disabled={submitting}>
              Criar horario
            </button>
          </form>
        </div>
      </div>
      <div className="app-panel rounded-[2rem] p-6 md:p-8">
        <h3 className="font-display text-xl text-white">Horarios da semana</h3>
        <p className="mt-2 text-sm text-soft">
          Somente o admin pode marcar cada horario como disponivel ou indisponivel.
        </p>
        {loading ? <p className="mt-4 text-sm text-soft">Carregando horarios...</p> : null}
        {!loading && !horarios.length ? (
          <p className="mt-4 text-sm text-soft">Nenhum horario encontrado para este periodo.</p>
        ) : null}
        {!loading && horarios.length ? (
          <div className="mt-6 flex flex-col gap-6">
            {Object.entries(grouped).map(([date, items]) => (
              <div key={date} className="app-panel-muted rounded-[1.6rem] p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-display text-lg text-white">{formatDateLabel(date)}</h4>
                    <span className="text-xs uppercase tracking-[0.2em] text-faint">
                      {items.length} horarios
                    </span>
                  </div>
                  <button
                    className="btn-danger px-4 py-2"
                    disabled={deletingDate === date}
                    onClick={() => handleDeleteDate(date)}
                    type="button"
                  >
                    {deletingDate === date ? "Excluindo..." : "Excluir dia"}
                  </button>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((horario) => (
                    <div
                      key={horario.id}
                      className="rounded-[1.3rem] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] px-4 py-4 flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="font-medium text-white">{horario.hora}</p>
                        <p className="text-xs text-faint">Controle manual do admin</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleAvailability(horario, true)}
                          disabled={updatingId === horario.id}
                          className={`btn-success px-3 py-2 ${
                            horario.disponivel ? "" : "opacity-70"
                          }`}
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleAvailability(horario, false)}
                          disabled={updatingId === horario.id}
                          className={`btn-danger px-3 py-2 ${
                            !horario.disponivel ? "" : "opacity-70"
                          }`}
                        >
                          Nao
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
