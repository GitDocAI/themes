import { lazy } from "react";
export const themeImports =(theme:string)=> {

  switch(theme){
    case 'crystal':
      return {
        Documentation: lazy(() => import("./crystal/pages/Documentation")),
        Login: lazy(() => import("./crystal/pages/Login")),
        SetPassword: lazy(() => import("./crystal/pages/SetPassword")),
        ResetPassword: lazy(() => import("./crystal/pages/ResetPassword")),
        ForgotPassword: lazy(() => import("./crystal/pages/ForgotPassword")),
        Profile: lazy(() => import("./crystal/pages/Profile")),
        Forbidden: lazy(() => import("./crystal/pages/403")),
      }
    default:
      return {
        Documentation: lazy(() => import("./crystal/pages/Documentation")),
        Login: lazy(() => import("./crystal/pages/Login")),
        SetPassword: lazy(() => import("./crystal/pages/SetPassword")),
        ResetPassword: lazy(() => import("./crystal/pages/ResetPassword")),
        ForgotPassword: lazy(() => import("./crystal/pages/ForgotPassword")),
        Profile: lazy(() => import("./crystal/pages/Profile")),
        Forbidden: lazy(() => import("./crystal/pages/403")),
      }

  }
};
