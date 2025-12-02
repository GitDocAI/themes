import { Routes, Route, Navigate } from "react-router-dom";
import Documentation from "./pages/Documentation";
import SetPassword from "./pages/SetPassword";
import Login from "./pages/Login";
import { getAccessToken } from "./utils/axiosInstance";
import Forbidden from "./pages/403";

export default function App() {
  const viteMode = import.meta.env.VITE_MODE || 'production';
  const isAuth = viteMode !== 'production' || (getAccessToken() !== null )
  return (
    <Routes>
      <Route path="/set-password/:invitation_token" element={<SetPassword />} />
      <Route path="/login" element={<Login />} />
      <Route path="/403" element={<Forbidden />} />
      {isAuth ? (
        <Route path="/*" element={<Documentation />} />
      ) : (
        <Route path="/*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}

