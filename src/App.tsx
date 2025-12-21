import { Routes, Route } from "react-router-dom";
import { Suspense, useEffect, useState } from "react";
import { configLoader, type GitDocAIConfig } from "./services/configLoader";
import ThemeLoadingScreen from "./commonPages/LoadingFalllback";
import ThemeErrorScreen from "./commonPages/ErrorFallback";
import { themeImports } from "./themeImports";

export default function App() {
  const [config, setConfig] = useState<GitDocAIConfig | null>(null);
  const [theme, setTheme] = useState<string | null>(null);
  const [loadingError, setLoadingError] = useState<boolean>(false);

  useEffect(() => {
    // Load config first - this gives us theme, colors, logos, etc.
    configLoader.loadConfig()
      .then((loadedConfig: GitDocAIConfig) => {
        setConfig(loadedConfig);
        // Get theme from config, default to 'crystal'
        setTheme(loadedConfig.theme || 'crystal');
      })
      .catch((_e: any) => {
        console.error('Failed to load config:', _e);
        setLoadingError(true);
      });
  }, []);

  if (loadingError) {
    return (
      <Routes>
        <Route path="/403" element={<ThemeErrorScreen />} />
        <Route
          path="/*"
          element={<ThemeErrorScreen />}
        />
      </Routes>
    );
  }

  if (!theme || !config) {
    return (
      <Routes>
        <Route path="/403" element={<ThemeErrorScreen />} />
        <Route
          path="/*"
          element={<ThemeLoadingScreen />}
        />
      </Routes>
    );
  }

  const { Documentation, SetPassword, ResetPassword, Forbidden, Login, ForgotPassword } = themeImports(theme)!;

  return (
    <Routes>
      <Route
        path="/auth/set-password"
        element={
          <Suspense fallback={<ThemeLoadingScreen />}>
            <SetPassword config={config} />
          </Suspense>
        }
      />
      <Route
        path="/auth/login"
        element={
          <Suspense fallback={<ThemeLoadingScreen />}>
            <Login config={config} />
          </Suspense>
        }
      />
      <Route
        path="/auth/forgot-password"
        element={
          <Suspense fallback={<ThemeLoadingScreen />}>
            <ForgotPassword config={config} />
          </Suspense>
        }
      />
      <Route
        path="/auth/reset-password"
        element={
          <Suspense fallback={<ThemeLoadingScreen />}>
            <ResetPassword config={config} />
          </Suspense>
        }
      />
      <Route path="/403" element={<Forbidden />} />
      <Route
        path="/*"
        element={
          <Suspense fallback={<ThemeLoadingScreen />}>
            <Documentation />
          </Suspense>
        }
      />
    </Routes>
  );
}
