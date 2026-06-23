import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import BrandLockup from "./components/BrandLockup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Agenda from "./pages/Agenda.jsx";
import Horarios from "./pages/Horarios.jsx";
import Login from "./pages/Login.jsx";
import Servicos from "./pages/Servicos.jsx";
import Assinaturas from "./pages/Assinaturas.jsx";
import { getToken } from "./api.js";

function ProtectedLayout({ children }) {
  const location = useLocation();
  const token = getToken();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!sidebarOpen) {
      document.body.style.overflow = "";
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [sidebarOpen]);

  if (!token) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="mx-auto max-w-[1640px] p-4 sm:p-6 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="hidden lg:block">
            <Sidebar />
          </div>

          <div className="flex min-w-0 flex-col gap-6">
            <div className="lg:hidden">
              <div className="app-panel rounded-[1.8rem] px-4 py-4">
                <div className="flex items-center gap-4">
                  <button
                    aria-label="Abrir menu"
                    aria-expanded={sidebarOpen}
                    aria-controls="mobile-navigation"
                    className="hamburger-button"
                    onClick={() => setSidebarOpen(true)}
                    type="button"
                  >
                    <span className="sr-only">Abrir menu</span>
                    <svg
                      aria-hidden="true"
                      className="hamburger-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M4 7H20" />
                      <path d="M4 12H20" />
                      <path d="M4 17H20" />
                    </svg>
                  </button>
                  <BrandLockup compact showTagline={false} className="min-w-0 flex-1" />
                </div>
              </div>
            </div>

            {sidebarOpen ? (
              <div className="mobile-drawer-shell is-open lg:hidden">
                <button
                  aria-label="Fechar menu"
                  className="mobile-drawer-backdrop"
                  onClick={() => setSidebarOpen(false)}
                  type="button"
                />
                <div className="mobile-drawer-panel">
                  <Sidebar
                    mobile
                    onClose={() => setSidebarOpen(false)}
                    onNavigate={() => setSidebarOpen(false)}
                  />
                </div>
              </div>
            ) : null}

            <main className="flex min-w-0 flex-col gap-6">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        }
      />
      <Route
        path="/agenda"
        element={
          <ProtectedLayout>
            <Agenda />
          </ProtectedLayout>
        }
      />
      <Route
        path="/horarios"
        element={
          <ProtectedLayout>
            <Horarios />
          </ProtectedLayout>
        }
      />
      <Route
        path="/servicos"
        element={
          <ProtectedLayout>
            <Servicos />
          </ProtectedLayout>
        }
      />
      <Route
        path="/assinaturas"
        element={
          <ProtectedLayout>
            <Assinaturas />
          </ProtectedLayout>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
