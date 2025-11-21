import { Routes, Route, Navigate } from "react-router-dom";
import Documentation from "./pages/Documentation";
import Login from "./pages/Login";

export default function App() {
  const isAuth = true
  const viteMode = import.meta.env.VITE_MODE || 'production'
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          isAuth
            ? (
                <Routes>
                  <Route path="/" element={<Documentation />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              )
            : <Navigate to="/login" replace />
        }
      />
    </Routes>
  );
}

