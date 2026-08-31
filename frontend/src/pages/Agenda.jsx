import { useEffect, useState, useCallback } from "react";
import Layout from "../components/Layout.jsx";
import ScheduleCalendar from "../components/ScheduleCalendar.jsx";
import { Plus, Search, Check, X, UserPlus } from "lucide-react";
import { api, todayIso, isoDaysAgo, isoDaysAhead, formatBRL } from "../api.js";

function statusPill(status) {
  const tone = {
    confirmado: "pill-blue",
    concluido: "pill-green",
    cancelado: "pill-red"
  };
  return <span className={`pill ${tone[status] || "pill-slate"}`}>{status}</span>;
}

export default function Agenda() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [dias, setDias] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ nome: "", telefone: "", data: todayIso(), hora: "09:00", servico: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [ag, ho, sv] = await Promise.all([
        api.agendamentos(),
        api.horarios(isoDaysAgo(7), isoDaysAhead(21)),
        api.servicos()
      ]);
      setAgendamentos(ag);
      setHorarios(ho);
      setDias(ag);
      setServicos(sv);
      setForm((f) => ({ ...f, servico: f.servico || sv[0]?.nome || "" }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtrados = dias.filter((a) =>
    String(a.nome || "").toLowerCase().includes(search.toLowerCase())
  );

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.criarAgendamento(form);
      setModal(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function concluir(id) {
    try {
      await api.concluirAgendamento(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function cancelar(id) {
    if (!window.confirm("Cancelar este agendamento?")) return;
    try {
      await api.cancelarAgendamento(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Layout title="Agenda" subtitle="Gerencie os atendimentos">
      <div className="flex flex-col gap-6">
        {error ? (
          <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-[#ff8f97]">{error}</div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              className="field pl-9"
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setModal(true)}>
            <Plus className="h-4 w-4" /> Novo agendamento
          </button>
        </div>

        <div className="panel min-w-0 overflow-hidden p-5 md:p-6">
          <ScheduleCalendar
            agendamentos={agendamentos}
            horarios={horarios}
            loading={loading}
            onGenerateWeek={() => api.gerarSemana(todayIso()).then(load)}
            onGoToday={load}
          />
        </div>

        <div className="panel p-5 md:p-6">
          <div className="mb-5">
            <p className="kicker">Atendimentos</p>
            <h3 className="mt-1 font-display text-lg font-semibold text-white">Todos os agendamentos</h3>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <p className="text-sm text-muted">Carregando...</p>
            ) : filtrados.length === 0 ? (
              <p className="text-sm text-muted">Nenhum agendamento encontrado.</p>
            ) : (
              <table className="tbl text-sm">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Hora</th>
                    <th>Cliente</th>
                    <th>Telefone</th>
                    <th>Serviço</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((a) => {
                    const sv = servicos.find((s) => s.nome === a.servico);
                    return (
                      <tr key={a.id}>
                        <td className="font-semibold text-[#7fb2ff]">{String(a.data).slice(0, 10)}</td>
                        <td className="text-white">{a.hora}</td>
                        <td className="text-white">{a.nome}</td>
                        <td className="text-muted">{a.telefone}</td>
                        <td className="text-slate-300">{a.servico}</td>
                        <td className="font-semibold text-white">{formatBRL(sv?.preco ?? 0)}</td>
                        <td>{statusPill(a.status)}</td>
                        <td>
                          {a.status === "confirmado" ? (
                            <div className="flex items-center gap-2">
                              <button className="btn btn-success px-2.5 py-1.5 text-xs" onClick={() => concluir(a.id)}>
                                <Check className="h-3.5 w-3.5" /> Concluir
                              </button>
                              <button className="btn btn-danger-ghost px-2.5 py-1.5 text-xs" onClick={() => cancelar(a.id)}>
                                <X className="h-3.5 w-3.5" /> Cancelar
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {modal ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModal(false)} />
          <form
            onSubmit={submit}
            className="panel relative z-10 w-full max-w-md p-6 md:p-8"
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-[#7fb2ff]">
                <UserPlus className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold text-white">Novo agendamento</h3>
                <p className="text-xs text-muted">Preencha os dados do cliente</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="kicker">Nome</span>
                <input className="field mt-1" required value={form.nome} placeholder="Nome do cliente"
                  onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="kicker">Telefone</span>
                <input className="field mt-1" required value={form.telefone} placeholder="(11) 99999-0000"
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="kicker">Data</span>
                  <input className="field mt-1" type="date" required value={form.data}
                    onChange={(e) => setForm({ ...form, data: e.target.value })} />
                </label>
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="kicker">Hora</span>
                  <input className="field mt-1" type="time" required value={form.hora}
                    onChange={(e) => setForm({ ...form, hora: e.target.value })} />
                </label>
              </div>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="kicker">Serviço</span>
                <select className="field mt-1" value={form.servico}
                  onChange={(e) => setForm({ ...form, servico: e.target.value })}>
                  {servicos.map((s) => (
                    <option key={s.id} value={s.nome}>{s.nome} — {formatBRL(s.preco)}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button type="button" className="btn btn-ghost flex-1" onClick={() => setModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
                {saving ? "Agendando..." : "Agendar"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </Layout>
  );
}
