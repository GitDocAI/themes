import { Routes, Route, Navigate } from "react-router-dom";
import { getAccessToken } from "./utils/axiosInstance";
import { lazy, Suspense, useEffect, useState } from "react";
import { configLoader } from "./services/configLoader";
import ThemeLoadingScreen from "./commonPages/LoadingFalllback";
import ThemeErrorScreen from "./commonPages/ErrorFallback";

export default function App() {
  const [theme, setTheme] = useState<string|null>(null);
  const [loadingError, setLoadingError] = useState<boolean>(false);

  const viteMode = import.meta.env.VITE_MODE || "production";
  const isAuth = viteMode !== "production" || getAccessToken() !== null;

  useEffect(() => {
    configLoader.getThemeName().then((t) => setTheme(t))
    .catch(_e=>setLoadingError(true))
    ;
  }, []);


  if(loadingError){
    return (<><ThemeErrorScreen/></>)
  }

  if (!theme) {
    return (<><ThemeLoadingScreen/></>)
  }

  const Documentation = lazy(() => import(`./${theme}/pages/Documentation`));
  const SetPassword = lazy(() => import(`./${theme}/pages/SetPassword`));
  const Login = lazy(() => import(`./${theme}/pages/Login`));
  const Forbidden = lazy(() => import(`./${theme}/pages/403`));

  return (
    <Routes>
      <Route
        path="/set-password/:invitation_token"
        element={
          <Suspense fallback={<><ThemeLoadingScreen/></>}>
            <SetPassword />
          </Suspense>
        }
      />
      <Route
        path="/login"
        element={
          <Suspense fallback={<><ThemeLoadingScreen/></>}>
            <Login />
          </Suspense>
        }
      />
      <Route path="/403" element={<Forbidden />} />

      {isAuth ? (
        <Route
          path="/*"
          element={
          <Suspense fallback={<><ThemeLoadingScreen/></>}>
              <Documentation />
            </Suspense>
          }
        />
      ) : (
        <Route path="/*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}

