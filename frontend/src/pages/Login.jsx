import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, setAuthSession } from "../api.js";
import BrandLockup from "../components/BrandLockup.jsx";
import { Scissors, CalendarDays, Wallet, Lock } from "lucide-react";

const highlights = [
  {
    icon: CalendarDays,
    title: "Agenda inteligente",
    description: "Controle de horários por barbeiro com visualização semanal."
  },
  {
    icon: Wallet,
    title: "Caixa & financeiro",
    description: "Faturamento, metas e relatórios de receita em tempo real."
  }
];

const stepList = [
  {
    title: "Crie seu aplicativo",
    description: "Atualize a descrição do seu aplicativo para a versão mais recente da especificação."
  },
  {
    title: "Vincule sua barbearia",
    description: "Conecte sua unidade para gerenciar agenda, clientes e caixa em um só lugar."
  },
  {
    title: "Comece a operar",
    description: "Aproveite o painel completo de gestão para sua barbearia."
  }
];

const initialForm = { email: "", senha: "" };

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(form)
      });
      setAuthSession(data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="panel w-full max-w-[1080px] overflow-hidden">
        <div className="grid lg:grid-cols-2">
          <div className="flex flex-col gap-8 p-8 md:p-10">
            <BrandLockup />

            <div className="space-y-6">
              <p className="text-sm text-muted">
                Acesso administrativo do Corte Certo para barbearias, barbeiros e estúdios.
              </p>

              <div className="hidden gap-3 sm:grid sm:grid-cols-1">
                {highlights.map((h) => (
                  <div key={h.title} className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-[#7fb2ff]">
                      <h.icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{h.title}</p>
                      <p className="text-xs text-muted">{h.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto hidden space-y-4 sm:block">
              {stepList.map((s, i) => (
                <div key={s.title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/50 bg-primary/15 font-display text-xs font-bold text-[#7fb2ff]">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{s.title}</p>
                    <p className="text-xs text-muted">{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 bg-white/[0.03] p-8 md:p-10 lg:border-l lg:border-t-0">
            <div className="mx-auto flex h-full w-full max-w-[400px] flex-col justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primaryLight shadow-[0_10px_24px_rgba(17,85,204,0.45)]">
                <Scissors className="h-6 w-6 text-white" />
              </div>
              <h1 className="mt-6 font-display text-3xl font-bold text-white">Entrar no painel</h1>
              <p className="mt-2 text-sm text-muted">
                Acesse com o e-mail e a senha da sua barbearia.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="kicker">E-mail</span>
                  <input
                    className="field mt-1"
                    placeholder="Digite seu e-mail"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm">
                  <span className="kicker">Senha</span>
                  <input
                    className="field mt-1"
                    placeholder="Digite sua senha"
                    type="password"
                    value={form.senha}
                    onChange={(e) => setForm({ ...form, senha: e.target.value })}
                  />
                </label>

                {error ? (
                  <p className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-[#ff8f97]">
                    {error}
                  </p>
                ) : null}

                <button className="btn btn-primary mt-2 w-full" disabled={loading} type="submit">
                  {loading ? "Entrando..." : "Entrar no painel"}
                </button>
              </form>

              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted">
                <Lock className="h-3.5 w-3.5" />
                Sessão protegida por token seguro
              </div>

              <div className="mt-6 rounded-xl border border-white/8 bg-white/4 p-4 text-xs text-muted">
                <p className="kicker mb-2">Credenciais de teste</p>
                <p>E-mail: <span className="text-slate-200">admin@cortecerto.local</span></p>
                <p>Senha: <span className="text-slate-200">admin123</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
