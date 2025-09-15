export type ThemeInfo = {
  name: string;
  description: string;
  theme: string;
  colors?: {
    light?: string;
    dark?: string;
  };
  defaultThemeMode: 'light' | 'dark' | string;
  logo?: {
    light?: string;
    dark?: string;
  };
  favicon?: string;
  background?: {
    image?: {

      dark: string;
      light: string;
    } | string,
    colors?: {
      dark: string;
      light: string;
    };
  };
  banner: string | {
    message: string;
    colors?: {
      light?: string;
      dark?: string;
    };
  };
  navbar: Array<
    NavBarItem
  >;
  footer: Array<
    FooterItem
  >;
  navigation:NavigationConfig ;
};

export type NavigationConfig = {
    versions?: Array<
      NavigationVersion
    >;
    tabs?: Array<NavigationTab>;
    items?: Array<NavigationItem>;
  }

export type NavBarItem = {
  type: 'link' | 'button' | string;
  label: string;
  reference: string;
}

export type NavigationVersion = {
  version: string;
  tabs?: Array<NavigationTab>;
  items?: Array<NavigationItem>;
}

export type FooterItem = {
  type: 'x' | 'github' | 'linkedin' | 'facebook' | 'youtube' | string;
  reference: string;
}

export type NavigationTab = {
  tab: string;
  items: Array<NavigationItem>;
};

export type NavigationItem =
  | NavigationPage
  | NavigationApiref
  | NavigationAgrupation
  ;

export type NavigationAgrupation =
  | NavigationGroup
  | NavigationDropdown;

export type NavigationGroup = {
  type: 'group';
  title: string;
  children: Array<NavigationItem>;
};

export type NavigationDropdown = {
  type: 'dropdown';
  title: string;
  children: Array<NavigationItem>;
};

export type NavigationPage = {
  type: 'page';
  title: string;
  page: string;
};


export type NavigationApiref = {
  method:string;
  type: 'openapi' | 'swagger';
  title: string;
  reference:string;
  page:string;
};


