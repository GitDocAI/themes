export type ThemeInfo = {
  name: string;
  description: string;
  theme: string;
  colors: {
    light: {
      primary: string;
      secondary: string;
    };
    dark: {
      primary: string;
      secondary: string;
    };
  };
  defaultThemeMode: 'light' | 'dark' | string;
  logo: {
    light: string;
    dark: string;
  };
  favicon: string;
  background: {
    image?: {

      dark: string;
      light: string;
    },
    colors?: {
      dark: string;
      light: string;
    };
  };
  banner: string;
  navbar: Array<
    NavBarItem
  >;
  footer: Array<
    FooterItem
  >;
  navigation: {
    versions?: Array<
      NavigationVersion
    >;
    tabs?: Array<NavigationTab>;
    items?: Array<NavigationItem>;
  };
};

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
  | NavigationGroup
  | NavigationDropdown
  | NavigationPage
  ;

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
