import { lazy } from "react";
export const themeImports =(theme:string)=> {

  switch(theme){
    case 'crystal':
      return {
        Documentation: lazy(() => import("./crystal/pages/Documentation")),
        Login: lazy(() => import("./crystal/pages/Login")),
        SetPassword: lazy(() => import("./crystal/pages/SetPassword")),
        Forbidden: lazy(() => import("./crystal/pages/403")),
      }
    default:
      return {
        Documentation: lazy(() => import("./crystal/pages/Documentation")),
        Login: lazy(() => import("./crystal/pages/Login")),
        SetPassword: lazy(() => import("./crystal/pages/SetPassword")),
        Forbidden: lazy(() => import("./crystal/pages/403")),
      }

  }
};
