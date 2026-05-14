import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Verify2FA from "./pages/Verify2FA";
import Dashboard from "./pages/Dashboard";
import WalletDetail from "./pages/WalletDetail";
import Transfer from "./pages/Transfer";
import Security from "./pages/Security";
import Layout from "./components/Layout";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function RootRedirect() {
  const { token } = useAuth();
  return <Navigate to={token ? "/dashboard" : "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-2fa" element={<Verify2FA />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/wallet/:id" element={<WalletDetail />} />
        <Route path="/transfer" element={<Transfer />} />
        <Route path="/security" element={<Security />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
