import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { Store, CreditCard, LogOut } from "lucide-react";
import { api, clearAuthSession } from "../api.js";

export default function Configuracoes() {
  const navigate = useNavigate();
  const [plano, setPlano] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.planos()
      .then((plans) => setPlano((plans || []).find((p) => p.ativo) || (plans || [])[0] || null))
      .catch(() => setPlano(null));
  }, []);

  function sair() {
    clearAuthSession();
    navigate("/login");
  }

  return (
    <Layout title="Configurações" subtitle="Preferências da sua barbearia">
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="panel p-5 md:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-[#7fb2ff]"><Store className="h-5 w-5" /></span>
            <div>
              <h3 className="font-display text-lg font-semibold text-white">Dados da barbearia</h3>
              <p className="text-sm text-muted">Informações gerais do estabelecimento</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="kicker">Nome da barbearia</span>
              <input className="field mt-2" defaultValue="Barbearia do João" />
            </label>
            <label className="block">
              <span className="kicker">E-mail</span>
              <input className="field mt-2" defaultValue="contato@barbeariadojoao.com" />
            </label>
            <label className="block sm:col-span-2">
              <span className="kicker">Telefone / WhatsApp</span>
              <input className="field mt-2" defaultValue="+55 (11) 99999-0000" />
            </label>
            <label className="block sm:col-span-2">
              <span className="kicker">Endereço</span>
              <input className="field mt-2" defaultValue="Av. Paulista, 1000 - São Paulo, SP" />
            </label>
          </div>
          <button className="btn btn-primary mt-5">Salvar alterações</button>
        </div>

        <div className="flex flex-col gap-6">
          <div className="panel p-5 md:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300"><CreditCard className="h-5 w-5" /></span>
              <div>
                <h3 className="font-display text-lg font-semibold text-white">Plano & assinatura</h3>
                <p className="text-sm text-muted">Gestão do seu plano</p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-primary/40 bg-primary/10 p-4">
              <div>
                <p className="font-display text-base font-semibold text-white">
                  {plano?.nome || "Plano Profissional"}
                </p>
                <p className="text-xs text-muted">
                  {plano ? `R$ ${Number(plano.valor).toFixed(2).replace(".", ",")}/mês · ${plano.cortes_inclusos} cortes inclusos` : "Carregando plano..."}
                </p>
              </div>
              <span className={`pill ${plano?.ativo ? "pill-green" : "pill-slate"}`}>{plano?.ativo ? "Ativo" : "..."}</span>
            </div>
            <button className="btn btn-ghost mt-4 w-full" onClick={() => alert("Gerenciamento de planos disponível em breve.")}>Ver opções de plano</button>
          </div>

          <div className="card p-5">
            {error ? (
              <div className="mb-3 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-[#ff8f97]">{error}</div>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-danger/15 text-[#ff8f97]"><LogOut className="h-5 w-5" /></span>
                <div>
                  <p className="text-sm font-semibold text-white">Sair da conta</p>
                  <p className="text-xs text-muted">Encerrar a sessão atual</p>
                </div>
              </div>
              <button className="btn btn-danger-ghost" onClick={sair}>Sair</button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
