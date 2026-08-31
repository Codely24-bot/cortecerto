import { useEffect, useState, useCallback } from "react";
import Layout from "../components/Layout.jsx";
import { Search, Users, CalendarCheck2, Tag } from "lucide-react";
import { api, formatBRL } from "../api.js";

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setClientes(await api.clientes());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtrados = clientes.filter((c) =>
    String(c.nome || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalGasto = clientes.reduce((s, c) => s + Number(c.total_gasto || 0), 0);
  const totalVisitas = clientes.reduce((s, c) => s + Number(c.visitas || 0), 0);

  return (
    <Layout title="Clientes" subtitle="Carteira de clientes">
      <div className="flex flex-col gap-6">
        {error ? (
          <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-[#ff8f97]">{error}</div>
        ) : null}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="card flex items-center gap-4 p-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-[#7fb2ff]">
              <Users className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm text-muted">Total de clientes</p>
              <p className="font-display text-lg font-bold text-white">{loading ? "..." : clientes.length}</p>
            </div>
          </div>
          <div className="card flex items-center gap-4 p-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
              <CalendarCheck2 className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm text-muted">Total de visitas</p>
              <p className="font-display text-lg font-bold text-white">{loading ? "..." : totalVisitas}</p>
            </div>
          </div>
          <div className="card flex items-center gap-4 p-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300">
              <Tag className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm text-muted">Total gasto</p>
              <p className="font-display text-lg font-bold text-white">{loading ? "..." : formatBRL(totalGasto)}</p>
            </div>
          </div>
        </div>

        <div className="panel p-5 md:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="kicker">Lista</p>
              <h3 className="mt-1 font-display text-lg font-semibold text-white">Todos os clientes</h3>
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input className="field pl-9" placeholder="Buscar cliente..." value={search}
                onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <p className="text-sm text-muted">Carregando...</p>
            ) : filtrados.length === 0 ? (
              <p className="text-sm text-muted">Nenhum cliente encontrado. Agende um atendimento para cadastrar clientes.</p>
            ) : (
              <table className="tbl text-sm">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Telefone</th>
                    <th>Visitas</th>
                    <th>Última visita</th>
                    <th>Total gasto</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((c) => (
                    <tr key={c.nome}>
                      <td className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#1a63d4] to-[#1250b8] font-display font-bold text-white">
                          {(c.nome || "?").charAt(0)}
                        </span>
                        <span className="font-semibold text-white">{c.nome}</span>
                      </td>
                      <td className="text-muted">{c.telefone || "—"}</td>
                      <td><span className="pill pill-slate">{c.visitas ?? 0}</span></td>
                      <td className="text-muted">{c.ultima_visita ? String(c.ultima_visita).slice(0, 10) : "—"}</td>
                      <td className="font-semibold text-white">{formatBRL(c.total_gasto ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
