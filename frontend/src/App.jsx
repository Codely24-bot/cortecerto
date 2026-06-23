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
                <div className="flex items-center justify-between gap-4">
                  <BrandLockup compact showTagline={false} />
                  <button
                    aria-label="Abrir menu"
                    aria-expanded={sidebarOpen}
                    className="btn-ghost px-4 py-3"
                    onClick={() => setSidebarOpen(true)}
                    type="button"
                  >
                    Menu
                  </button>
                </div>
              </div>
            </div>

            {sidebarOpen ? (
              <div className="fixed inset-0 z-40 lg:hidden">
                <button
                  aria-label="Fechar menu"
                  className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                  onClick={() => setSidebarOpen(false)}
                  type="button"
                />
                <div className="absolute inset-y-0 left-0 w-[min(88vw,330px)] p-4">
                  <Sidebar mobile onNavigate={() => setSidebarOpen(false)} />
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
