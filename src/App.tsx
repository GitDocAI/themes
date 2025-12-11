import { Routes, Route, Navigate } from "react-router-dom";
import { getAccessToken } from "./utils/axiosInstance";
import  { lazy, Suspense } from 'react';
const theme = 'crystal'

const Documentation = lazy(() => import(`./${theme}/pages/Documentation`));
const SetPassword = lazy(() => import(`./${theme}/pages/SetPassword`));

const Login = lazy(()=> import(`./${theme}/pages/Login`));
const Forbidden =lazy(()=>import( `./${theme}/pages/403`));


import 'primeicons/primeicons.css';

export default function App() {
  const viteMode = import.meta.env.VITE_MODE || 'production';
  const isAuth = viteMode !== 'production' || (getAccessToken() !== null )
  return (
    <Routes>
      <Route path="/set-password/:invitation_token" element={
        <Suspense fallback={<div>Loading...</div>}>
          <SetPassword />
        </Suspense>
      } />
      <Route path="/login" element={
        <Suspense fallback={<div>Loading...</div>}>
            <Login />
        </Suspense>
      } />
      <Route path="/403" element={<Forbidden />} />
      {isAuth ? (
        <Route path="/*" element={
            <Suspense fallback={<div>Loading...</div>}>
                <Documentation />
            </Suspense>
          } />
      ) : (
        <Route path="/*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}

