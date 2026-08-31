import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import Agenda from "./pages/Agenda.jsx";
import Clientes from "./pages/Clientes.jsx";
import Caixa from "./pages/Caixa.jsx";
import Chatbot from "./pages/Chatbot.jsx";
import Configuracoes from "./pages/Configuracoes.jsx";
import Login from "./pages/Login.jsx";
import { getToken } from "./api.js";

function HomeRoute() {
  return getToken() ? <Navigate to="/dashboard" replace /> : <Login />;
}

function RequireAuth({ children }) {
  if (!getToken()) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/agenda" element={<RequireAuth><Agenda /></RequireAuth>} />
      <Route path="/clientes" element={<RequireAuth><Clientes /></RequireAuth>} />
      <Route path="/caixa" element={<RequireAuth><Caixa /></RequireAuth>} />
      <Route path="/chatbot" element={<RequireAuth><Chatbot /></RequireAuth>} />
      <Route path="/configuracoes" element={<RequireAuth><Configuracoes /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
