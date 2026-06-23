import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api.js";
import BrandLockup from "../components/BrandLockup.jsx";

const highlights = [
  {
    title: "Agendamentos",
    description: "Organize a agenda com uma experiencia premium e objetiva."
  },
  {
    title: "Clientes",
    description: "Tenha historico, recorrencia e operacao do dia em um so lugar."
  },
  {
    title: "Faturamento",
    description: "Acompanhe indicadores e receitas com leitura imediata."
  },
  {
    title: "Multi-barbearia",
    description: "Escale a gestao para novas unidades sem perder controle."
  }
];

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(form)
      });
      localStorage.setItem("admin_token", data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-[1640px] items-center px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid w-full gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <div className="app-panel-strong surface-grid relative overflow-hidden rounded-[2.2rem] p-6 md:p-8 xl:p-10">
          <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(215,164,61,0.16),transparent_68%)]" />
          <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.06),transparent_72%)]" />

          <div className="relative flex h-full flex-col gap-8">
            <BrandLockup showTagline={false} />

            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div className="space-y-6">
                <div>
                  <p className="section-kicker">A gestao completa da sua barbearia</p>
                  <h1 className="mt-4 max-w-xl font-display text-4xl font-semibold leading-tight text-white md:text-5xl">
                    Visual escuro, operacao centralizada e identidade premium.
                  </h1>
                  <p className="mt-5 max-w-xl text-base leading-8 text-soft">
                    O MESTRE DA NAVALHA foi desenhado para comandar agenda, clientes,
                    servicos, receitas e recorrencia em uma interface elegante e direta.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {highlights.map((item) => (
                    <div
                      key={item.title}
                      className="app-panel rounded-[1.6rem] p-4"
                    >
                      <p className="font-display text-base font-semibold text-white">
                        {item.title}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-soft">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-center gap-5">
                <div className="brand-frame overflow-hidden rounded-[2rem] p-3">
                  <img
                    src="/brand/logo.png"
                    alt="Logo MESTRE DA NAVALHA"
                    className="h-auto w-full max-w-[540px] rounded-[1.4rem] object-cover"
                  />
                </div>
                <p className="text-center text-sm uppercase tracking-[0.34em] text-faint">
                  Controle, imagem e crescimento em um so ecossistema
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="app-panel rounded-[2.2rem] p-6 md:p-8 xl:p-10">
          <div className="mx-auto flex h-full w-full max-w-[440px] flex-col justify-center">
            <p className="section-kicker">Acesso administrativo</p>
            <h2 className="mt-4 font-display text-4xl font-semibold text-white">
              Entrar no painel
            </h2>
            <p className="mt-4 text-base leading-8 text-soft">
              Use suas credenciais para acessar a operacao da barbearia com o novo
              layout MESTRE DA NAVALHA.
            </p>

            <div className="mt-8 rounded-[1.8rem] border border-[rgba(242,200,107,0.16)] bg-[rgba(255,255,255,0.025)] p-5">
              <BrandLockup compact className="items-center" />
            </div>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
              <label className="flex flex-col gap-2 text-sm text-soft">
                Usuario
                <input
                  className="field-dark"
                  placeholder="Digite seu usuario"
                  value={form.username}
                  onChange={(event) =>
                    setForm({ ...form, username: event.target.value })
                  }
                />
              </label>

              <label className="flex flex-col gap-2 text-sm text-soft">
                Senha
                <input
                  className="field-dark"
                  placeholder="Digite sua senha"
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    setForm({ ...form, password: event.target.value })
                  }
                />
              </label>

              {error ? <p className="alert-error">{error}</p> : null}

              <button className="btn-gold mt-2 w-full" type="submit">
                Entrar
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-faint">
              A gestao completa da sua barbearia em uma experiencia refinada.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
