import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Wallet,
  MessageSquareText,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Scissors
} from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/caixa", label: "Caixa", icon: Wallet },
  { to: "/chatbot", label: "Chatbot", icon: MessageSquareText },
  { to: "/configuracoes", label: "Configurações", icon: Settings }
];

export default function Sidebar({ collapsed = false, onToggle, mobile = false, onNavigate }) {
  return (
    <div className={`flex h-full flex-col gap-6 ${mobile ? "w-[272px]" : "w-full"} transition-all duration-300`}>
      <div
        className={`flex items-center gap-3 border-b border-white/10 pb-6 ${
          collapsed && !mobile ? "justify-center px-0" : "px-2"
        }`}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primaryLight shadow-[0_10px_24px_rgba(17,85,204,0.45)]">
          <Scissors className="h-5 w-5 text-white" />
        </div>
        {(!collapsed || mobile) && (
          <div className="leading-tight">
            <p className="font-display text-lg font-bold tracking-tight text-white">Corte Certo</p>
            <p className="text-xs text-muted">Gestão de barbearia</p>
          </div>
        )}
      </div>

      <nav className="sidebar-nav flex-1 overflow-y-auto px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""} ${
                  collapsed && !mobile ? "justify-center px-0" : ""
                }`
              }
              title={collapsed && !mobile ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {(!collapsed || mobile) && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 px-1">
        {collapsed && !mobile ? (
          <div className="flex justify-center">
            <span className="pill pill-green">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            </span>
          </div>
        ) : (
          <div className="rounded-xl border border-primary/40 bg-primary/10 p-3">
            <p className="kicker">Plano atual</p>
            <p className="mt-1 font-display text-sm font-semibold text-white">Plano Profissional</p>
            <p className="mt-1 text-xs text-muted">Válido até 30/09/2026</p>
            <span className="pill pill-green mt-3">Ativo</span>
          </div>
        )}

        {!mobile && (
          <button
            onClick={onToggle}
            title={collapsed ? "Expandir menu" : "Recolher menu"}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm text-slate-300 transition hover:bg-white/10"
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            {!collapsed && <span>Recolher menu</span>}
          </button>
        )}
      </div>
    </div>
  );
}
