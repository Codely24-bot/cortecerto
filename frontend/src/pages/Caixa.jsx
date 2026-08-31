import { useEffect, useState, useCallback } from "react";
import Layout from "../components/Layout.jsx";
import { Banknote, Search } from "lucide-react";
import { api, todayIso, isoDaysAgo, formatBRL } from "../api.js";

const METODO_LABEL = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartao_debito: "Cartão débito",
  cartao_credito: "Cartão crédito",
  fiado: "Fiado",
  nao_informado: "Não informado",
  outro: "Outro"
};

function metodoTone(m) {
  if (m === "pix") return "pill-blue";
  if (m === "cartao_debito" || m === "cartao_credito") return "pill-purple";
  return "pill-slate";
}

export default function Caixa() {
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [payForm, setPayForm] = useState({ status: "pago", metodo: "pix", valor: "" });

  const load = useCallback(async (status) => {
    setLoading(true);
    setError("");
    try {
      const filters = {
        dataInicio: isoDaysAgo(30),
        dataFim: todayIso(),
        statusPagamento: status || undefined
      };
      setItens(await api.financeiro(filters));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(statusFilter);
  }, [statusFilter, load]);

  const totalPago = itens
    .filter((i) => i.status_pagamento === "pago")
    .reduce((s, i) => s + Number(i.valor_cobrado || 0), 0);
  const totalPendente = itens
    .filter((i) => i.status_pagamento === "pendente")
    .reduce((s, i) => s + Number(i.valor_cobrado || 0), 0);

  function openModal(item) {
    setPayForm({ status: item.status_pagamento === "pago" ? "pago" : "pendente", metodo: item.metodo_pagamento || "pix", valor: item.valor_cobrado || "" });
    setModal(item);
  }

  async function submit(e) {
    e.preventDefault();
    if (!modal) return;
    setSaving(true);
    setError("");
    try {
      await api.registrarPagamento(modal.id, payForm);
      setModal(null);
      await load(statusFilter);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout title="Caixa" subtitle="Controle financeiro">
      <div className="flex flex-col gap-6">
        {error ? (
          <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-[#ff8f97]">{error}</div>
        ) : null}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="panel-white p-5">
            <p className="kicker !text-slate-400">Total recebido (30d)</p>
            <p className="mt-2 font-display text-3xl font-bold text-[#0B2447]">{formatBRL(totalPago)}</p>
          </div>
          <div className="panel-white p-5">
            <p className="kicker !text-slate-400">A receber (pendente)</p>
            <p className="mt-2 font-display text-3xl font-bold text-[#E71D2B]">{formatBRL(totalPendente)}</p>
          </div>
          <div className="panel-white p-5">
            <p className="kicker !text-slate-400">Lançamentos</p>
            <p className="mt-2 font-display text-3xl font-bold text-[#0B2447]">{itens.length}</p>
          </div>
        </div>

        <div className="panel p-5 md:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="kicker">Lançamentos</p>
              <h3 className="mt-1 font-display text-lg font-semibold text-white">Movimentações de atendimentos</h3>
            </div>
            <div className="flex items-center gap-2">
              <select className="field w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">Todos</option>
                <option value="pago">Pagos</option>
                <option value="pendente">Pendentes</option>
              </select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input className="field w-44 pl-9" placeholder="Buscar..." />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <p className="text-sm text-muted">Carregando...</p>
            ) : itens.length === 0 ? (
              <p className="text-sm text-muted">Nenhum atendimento financeiro encontrado.</p>
            ) : (
              <table className="tbl text-sm">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Cliente</th>
                    <th>Serviço</th>
                    <th>Forma</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map((c) => (
                    <tr key={c.id}>
                      <td className="text-muted">{String(c.data).slice(0, 10)}</td>
                      <td className="text-white">{c.nome}</td>
                      <td className="text-slate-300">{c.servico}</td>
                      <td><span className={`pill ${metodoTone(c.metodo_pagamento)}`}>{METODO_LABEL[c.metodo_pagamento] || c.metodo_pagamento}</span></td>
                      <td className="font-semibold text-white">{formatBRL(c.valor_cobrado)}</td>
                      <td>
                        <span className={`pill ${c.status_pagamento === "pago" ? "pill-green" : "pill-red"}`}>
                          {c.status_pagamento}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-ghost px-2.5 py-1.5 text-xs" onClick={() => openModal(c)}>
                          Registrar pagamento
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {modal ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModal(null)} />
          <form onSubmit={submit} className="panel relative z-10 w-full max-w-sm p-6 md:p-7">
            <h3 className="font-display text-lg font-semibold text-white">Registrar pagamento</h3>
            <p className="mt-1 text-sm text-muted">{modal.nome} — {modal.servico}</p>

            <div className="mt-5 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="kicker">Status</span>
                <select className="field mt-1" value={payForm.status} onChange={(e) => setPayForm({ ...payForm, status: e.target.value })}>
                  <option value="pago">Pago</option>
                  <option value="pendente">Pendente</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="kicker">Método</span>
                <select className="field mt-1" value={payForm.metodo} onChange={(e) => setPayForm({ ...payForm, metodo: e.target.value })}>
                  {Object.entries(METODO_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="kicker">Valor</span>
                <input className="field mt-1" type="number" step="0.01" value={payForm.valor}
                  onChange={(e) => setPayForm({ ...payForm, valor: e.target.value })} />
              </label>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button type="button" className="btn btn-ghost flex-1" onClick={() => setModal(null)}>Cancelar</button>
              <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </Layout>
  );
}
