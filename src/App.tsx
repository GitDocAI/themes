import { Routes, Route } from "react-router-dom";
import { Suspense, useEffect, useState } from "react";
import { configLoader } from "./services/configLoader";
import ThemeLoadingScreen from "./commonPages/LoadingFalllback";
import ThemeErrorScreen from "./commonPages/ErrorFallback";
import { themeImports } from "./themeImports";

export default function App() {
  const [theme, setTheme] = useState<string|null>(null);
  const [loadingError, setLoadingError] = useState<boolean>(false);

  useEffect(() => {
    configLoader.getThemeName().then((t:string) => setTheme(t))
    .catch((_e:any)=>setLoadingError(true))
    ;
  }, []);


  if(loadingError){
    return (

      <Routes>
      <Route path="/403" element={<ThemeErrorScreen/>} />
        <Route
          path="/*"
          element={
              <ThemeErrorScreen/>
          }
        />
      </Routes>
    )
  }

  if (!theme) {
    return (

      <Routes>
      <Route path="/403" element={<ThemeErrorScreen/>} />
        <Route
          path="/*"
          element={
            <ThemeLoadingScreen/>
          }
        />
      </Routes>
      )
  }


  const {Documentation,SetPassword,Forbidden,Login}=themeImports(theme)!

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
        <Route
          path="/*"
          element={
          <Suspense fallback={<>
              <ThemeLoadingScreen/></>}>
              <Documentation />
            </Suspense>
          }
        />
      )
    </Routes>
  );
}

