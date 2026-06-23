import { NavLink } from "react-router-dom";
import BrandLockup from "./BrandLockup.jsx";

const links = [
  { to: "/dashboard", label: "Dashboard", hint: "Visao executiva" },
  { to: "/agenda", label: "Agendamentos", hint: "Atendimentos do dia" },
  { to: "/horarios", label: "Horarios", hint: "Escala e disponibilidade" },
  { to: "/servicos", label: "Servicos", hint: "Catalogo e precos" },
  { to: "/assinaturas", label: "Assinaturas", hint: "Mensalistas e recorrencia" }
];

export default function Sidebar({ mobile = false, onNavigate }) {
  return (
    <aside
      className={`app-panel rounded-[2rem] p-5 md:p-6 flex h-full flex-col gap-8 ${
        mobile ? "min-h-full" : ""
      }`}
    >
      <BrandLockup />

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
                    className={`font-medium ${
                      isActive ? "text-[#f2c86b]" : "text-[rgba(246,240,230,0.96)]"
                    }`}
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
        <p className="section-kicker">Operacao</p>
        <p className="mt-3 text-sm text-soft">
          Controle agenda, clientes, faturamento e recorrencia em um unico painel.
        </p>
      </div>
    </aside>
  );
}
