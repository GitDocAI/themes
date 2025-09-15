import { ThemeInfo,NavigationItem } from "../models/ThemeInfo";

export const openapi_path_builder = (config: ThemeInfo): ThemeInfo => {
  const cleanPath = (str: string): string => {
    return str.replace(" ", "_").toLowerCase();
  };

  const appendPageToItem = (path: string, item: NavigationItem) => {
    if (item.type === "openapi" || item.type === "swagger") {
      item.page = `/${path}/${cleanPath(item.title)}.mdx`;
    }
  };

  const traverseItems = (path: string, items: NavigationItem[] | undefined) => {
    if (!items) return;
    for (const item of items) {
      appendPageToItem(path, item);
      if ("children" in item && item.children) {
        traverseItems(`${path}/${cleanPath(item.title)}`, item.children);
      }
    }
  };

  if (config.navigation) {
    if (config.navigation.versions) {
      for (const version of config.navigation.versions) {
        const versionPath = cleanPath(version.version);
        if (version.tabs) {
          for (const tab of version.tabs) {
            const tabPath = `${versionPath}/${cleanPath(tab.tab)}`;
            traverseItems(tabPath, tab.items);
          }
        }
        traverseItems(versionPath, version.items);
      }
    }

    if (config.navigation.tabs) {
      for (const tab of config.navigation.tabs) {
        const tabPath = `/${cleanPath(tab.tab)}`;
        traverseItems(tabPath, tab.items);
      }
    }

    traverseItems("", config.navigation.items);
  }

  return config;
};

