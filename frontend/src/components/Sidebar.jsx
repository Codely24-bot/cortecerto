import { NavLink, useNavigate } from "react-router-dom";
import BrandLockup from "./BrandLockup.jsx";
import { clearAuthSession, getCurrentUser } from "../api.js";

const links = [
  { to: "/dashboard", label: "Dashboard", hint: "Visao executiva" },
  { to: "/financeiro", label: "Financeiro", hint: "Pagamentos do caixa" },
  { to: "/agenda", label: "Agendamentos", hint: "Atendimentos do dia" },
  { to: "/horarios", label: "Horarios", hint: "Escala e disponibilidade" },
  { to: "/servicos", label: "Servicos", hint: "Catalogo e precos" },
  { to: "/assinaturas", label: "Assinaturas", hint: "Mensalistas e recorrencia" }
];

export default function Sidebar({ mobile = false, onNavigate, onClose }) {
  const navigate = useNavigate();
  const user = getCurrentUser();

  function handleLogout() {
    clearAuthSession();
    onClose?.();
    onNavigate?.();
    navigate("/", { replace: true });
  }

  return (
    <aside
      id={mobile ? "mobile-navigation" : undefined}
      className={`app-panel flex h-full flex-col gap-8 rounded-[2rem] p-5 md:p-6 ${
        mobile ? "min-h-full overflow-y-auto" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <BrandLockup className="min-w-0 flex-1" />
        {mobile ? (
          <button
            aria-label="Fechar menu"
            className="btn-ghost mt-1 h-11 w-11 shrink-0 px-0 text-xl leading-none"
            onClick={() => onClose?.()}
            type="button"
          >
            &times;
          </button>
        ) : null}
      </div>

      <div className="gold-divider" />

      <nav className="flex flex-col gap-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            onClick={() => onNavigate?.()}
            to={link.to}
            className={({ isActive }) =>
              [
                "group rounded-[1.35rem] border px-4 py-3 transition",
                isActive
                  ? "border-[rgba(242,200,107,0.3)] bg-[rgba(215,164,61,0.14)] shadow-[0_12px_28px_rgba(215,164,61,0.12)]"
                  : "border-transparent bg-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.04)]"
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p
                    className="font-medium text-white"
                  >
                    {link.label}
                  </p>
                  <p className="mt-1 text-xs text-faint">{link.hint}</p>
                </div>
                <span
                  className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                    isActive ? "bg-[#f2c86b]" : "bg-[rgba(255,255,255,0.12)]"
                  }`}
                />
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto rounded-[1.6rem] border border-[rgba(242,200,107,0.14)] bg-[rgba(255,255,255,0.02)] p-4">
        <p className="section-kicker">Conta SaaS</p>
        <p className="mt-3 font-medium text-white">
          {user?.barbearia?.nome || "Barbearia"}
        </p>
        <p className="mt-2 text-sm text-soft">
          {user?.nome || "Usuario"} • {user?.email || "sem e-mail"}
        </p>
        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-faint">
          R$ {Number(user?.barbearia?.valorMensal || 99.9).toFixed(2).replace(".", ",")}/mes
        </p>
        <button
          className="btn-ghost mt-4 w-full"
          onClick={handleLogout}
          type="button"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
