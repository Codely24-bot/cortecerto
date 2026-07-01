import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, setAuthSession } from "../api.js";
import BrandLockup from "../components/BrandLockup.jsx";

const highlights = [
  {
    title: "SaaS recorrente",
    description: "Plano mensal de R$ 99,90 para operar agenda, servicos e recorrencia."
  },
  {
    title: "Multi-barbearia",
    description: "Cada conta entra com seu proprio login e enxerga apenas os dados da sua unidade."
  },
  {
    title: "Cadastro com e-mail",
    description: "O responsavel da barbearia cria a conta com e-mail e senha salvos no banco."
  },
  {
    title: "Pronto para escalar",
    description: "Estrutura preparada para barbeiros autonomos e barbearias com mais de uma cadeira."
  }
];

const initialLoginForm = {
  email: "",
  senha: ""
};

const initialRegisterForm = {
  nome: "",
  nomeBarbearia: "",
  email: "",
  senha: "",
  confirmarSenha: "",
  tipoConta: "barbearia"
};

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function changeMode(nextMode) {
    setMode(nextMode);
    setError("");
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(loginForm)
      });

      setAuthSession(data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterSubmit(event) {
    event.preventDefault();
    setError("");

    if (registerForm.senha !== registerForm.confirmarSenha) {
      setError("A confirmacao de senha nao confere.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        nome: registerForm.nome,
        nomeBarbearia: registerForm.nomeBarbearia,
        email: registerForm.email,
        senha: registerForm.senha,
        tipoConta: registerForm.tipoConta
      };

      const data = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload)
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
                  <p className="section-kicker">SaaS para barbearias</p>
                  <h1 className="mt-4 max-w-xl font-display text-4xl font-semibold leading-tight text-white md:text-5xl">
                    Cadastro por e-mail, assinatura mensal e operacao isolada por unidade.
                  </h1>
                  <p className="mt-5 max-w-xl text-base leading-8 text-soft">
                    O MESTRE DA NAVALHA agora esta pronto para atender varias barbearias em um
                    unico SaaS, com login seguro, separacao de dados e plano mensal de R$ 99,90.
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
                  Acesso com e-mail, senha e tenancy por barbearia
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="app-panel rounded-[2.2rem] p-6 md:p-8 xl:p-10">
          <div className="mx-auto flex h-full w-full max-w-[460px] flex-col justify-center">
            <p className="section-kicker">Acesso administrativo</p>
            <h2 className="mt-4 font-display text-4xl font-semibold text-white">
              {mode === "login" ? "Entrar no painel" : "Criar conta SaaS"}
            </h2>
            <p className="mt-4 text-base leading-8 text-soft">
              {mode === "login"
                ? "Entre com e-mail e senha para abrir apenas os dados da sua barbearia."
                : "Cadastre sua barbearia ou operacao individual com mensalidade de R$ 99,90."}
            </p>

            <div className="mt-8 rounded-[1.8rem] border border-[rgba(242,200,107,0.16)] bg-[rgba(255,255,255,0.025)] p-5">
              <div className="flex flex-wrap gap-3">
                <button
                  className={mode === "login" ? "btn-gold" : "btn-ghost"}
                  onClick={() => changeMode("login")}
                  type="button"
                >
                  Entrar
                </button>
                <button
                  className={mode === "register" ? "btn-gold" : "btn-ghost"}
                  onClick={() => changeMode("register")}
                  type="button"
                >
                  Criar conta
                </button>
              </div>
              <div className="mt-5">
                <BrandLockup compact className="items-center" />
              </div>
            </div>

            {mode === "login" ? (
              <form onSubmit={handleLoginSubmit} className="mt-8 flex flex-col gap-4">
                <label className="flex flex-col gap-2 text-sm text-soft">
                  E-mail
                  <input
                    className="field-dark"
                    placeholder="Digite seu e-mail"
                    type="email"
                    value={loginForm.email}
                    onChange={(event) =>
                      setLoginForm({ ...loginForm, email: event.target.value })
                    }
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm text-soft">
                  Senha
                  <input
                    className="field-dark"
                    placeholder="Digite sua senha"
                    type="password"
                    value={loginForm.senha}
                    onChange={(event) =>
                      setLoginForm({ ...loginForm, senha: event.target.value })
                    }
                  />
                </label>

                {error ? <p className="alert-error">{error}</p> : null}

                <button className="btn-gold mt-2 w-full" disabled={loading} type="submit">
                  {loading ? "Entrando..." : "Entrar com e-mail"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="mt-8 flex flex-col gap-4">
                <label className="flex flex-col gap-2 text-sm text-soft">
                  Perfil
                  <select
                    className="field-dark"
                    value={registerForm.tipoConta}
                    onChange={(event) =>
                      setRegisterForm({ ...registerForm, tipoConta: event.target.value })
                    }
                  >
                    <option value="barbearia">Tenho uma barbearia</option>
                    <option value="barbeiro">Sou barbeiro autonomo</option>
                  </select>
                </label>

                <label className="flex flex-col gap-2 text-sm text-soft">
                  Nome do responsavel
                  <input
                    className="field-dark"
                    placeholder="Seu nome"
                    value={registerForm.nome}
                    onChange={(event) =>
                      setRegisterForm({ ...registerForm, nome: event.target.value })
                    }
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm text-soft">
                  {registerForm.tipoConta === "barbeiro"
                    ? "Nome profissional ou do estudio"
                    : "Nome da barbearia"}
                  <input
                    className="field-dark"
                    placeholder="Como sua operacao sera exibida"
                    value={registerForm.nomeBarbearia}
                    onChange={(event) =>
                      setRegisterForm({ ...registerForm, nomeBarbearia: event.target.value })
                    }
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm text-soft">
                  E-mail
                  <input
                    className="field-dark"
                    placeholder="E-mail principal da conta"
                    type="email"
                    value={registerForm.email}
                    onChange={(event) =>
                      setRegisterForm({ ...registerForm, email: event.target.value })
                    }
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm text-soft">
                  Senha
                  <input
                    className="field-dark"
                    placeholder="Crie uma senha forte"
                    type="password"
                    value={registerForm.senha}
                    onChange={(event) =>
                      setRegisterForm({ ...registerForm, senha: event.target.value })
                    }
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm text-soft">
                  Confirmar senha
                  <input
                    className="field-dark"
                    placeholder="Repita a senha"
                    type="password"
                    value={registerForm.confirmarSenha}
                    onChange={(event) =>
                      setRegisterForm({
                        ...registerForm,
                        confirmarSenha: event.target.value
                      })
                    }
                  />
                </label>

                {error ? <p className="alert-error">{error}</p> : null}

                <button className="btn-gold mt-2 w-full" disabled={loading} type="submit">
                  {loading ? "Criando conta..." : "Criar conta por R$ 99,90/mes"}
                </button>
              </form>
            )}

            <p className="mt-6 text-center text-sm text-faint">
              Credenciais salvas no banco e sessao autenticada por token seguro.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
