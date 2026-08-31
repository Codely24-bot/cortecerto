import { useEffect, useState } from "react";
import { Bell, Menu, X } from "lucide-react";
import Sidebar from "./Sidebar.jsx";

export default function Layout({ title, subtitle, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="flex min-h-screen">
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 border-r border-white/10 bg-[#04101f]/80 p-4 backdrop-blur-md lg:block ${
          collapsed ? "lg:w-[84px]" : "lg:w-[264px]"
        } transition-all duration-300`}
      >
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 bg-[#04101f] p-4 shadow-2xl">
            <div className="mb-4 flex justify-end">
              <button className="btn btn-ghost px-3 py-2" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <Sidebar mobile onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#071A33]/85 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-8">
            <div className="flex items-center gap-3">
              <button className="btn btn-ghost px-2.5 py-2.5 lg:hidden" onClick={() => setMobileOpen(true)}>
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <h1 className="font-display text-2xl font-bold text-white md:text-3xl">{title}</h1>
                {subtitle ? <p className="mt-1 text-sm capitalize text-muted">{subtitle}</p> : null}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-200 transition hover:bg-white/10">
                <Bell className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger ring-2 ring-[#071A33]" />
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1a63d4] to-[#8b5cf6] font-display font-bold text-white shadow-[0_6px_14px_rgba(17,85,204,0.4)]">
                J
              </div>
            </div>
          </div>
        </header>

        <main className="fade-up flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
