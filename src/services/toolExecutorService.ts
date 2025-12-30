import { configLoader as ConfigLoader, type Version } from './configLoader'
import type { NavigationItem } from '../types/navigation'
import { searchService, type SearchHit, type SearchResponse } from './searchService'
import { pageLoader } from './pageLoader'
import axiosInstance from '../utils/axiosInstance'

const loadConfig = ConfigLoader.loadConfig.bind(ConfigLoader)
const updateConfig = ConfigLoader.updateConfig.bind(ConfigLoader)

import { type ChatContext } from './agentService'
import { ContentService } from './contentService'
import { mdxSerializer } from './mdxSerializer'


export const toolExecutor = {
  async execute(toolName: string, args: any, uiCallbacks?: any): Promise<any> {
    switch (toolName) {
      case 'create_version': {
        const config = await loadConfig()
        const newVersion = {
          version: args.version,
          tabs: [],
        }

        if (!config.navigation) {
          config.navigation = {}
        }
        if (!config.navigation.versions) {
          config.navigation.versions = []
        }

        const existingVersion = config.navigation.versions.find(
          (v: Version) => v.version === args.version
        )
        if (existingVersion) {
          return { results: { error: `Version ${args.version} already exists.` } }
        }

        config.navigation.versions.push(newVersion)

        await ContentService.saveConfig(config)
        updateConfig(config)
        return { results: { success: 'true' } }
      }
      case 'create_tab': {
        const config = await loadConfig()
        const newTab = {
          tab: args.tab_name,
          items: [],
        }

        if (!config.navigation) {
          config.navigation = {}
        }

        if (args.parent_version) {
          if (!config.navigation.versions) {
            return { results: { error: `Navigation versions not found` } }
          }
          const version = config.navigation.versions.find(
            (v: Version) => v.version === args.parent_version
          )
          if (version) {
            if (!version.tabs) {
              version.tabs = []
            }
            const existingTab = version.tabs.find(
              (t) => t.tab === args.tab_name
            )
            if (existingTab) {
              return {
                results: { error: `Tab ${args.tab_name} already exists in version ${args.parent_version}.` },
              }
            }
            version.tabs.push(newTab)
          } else {
            return { results: { error: `Version ${args.parent_version} not found` } }
          }
        } else {
          if (!config.navigation.tabs) {
            config.navigation.tabs = []
          }
          const existingTab = config.navigation.tabs.find(
            (t) => t.tab === args.tab_name
          )
          if (existingTab) {
            return { results: { error: `Tab ${args.tab_name} already exists.` } }
          }
          config.navigation.tabs.push(newTab)
        }

        await ContentService.saveConfig(config)
        updateConfig(config)
        return { results: { success: 'true' } }
      }
      case 'create_grouper': {
        const config = await loadConfig()

        const newGrouper: NavigationItem = {
          title: args.group_name,
          type: args.group_type,
          children: [],
        }

        if (!config.navigation) {
          config.navigation = {}
        }

        let targetItemsArray: NavigationItem[] | undefined

        if (!args.parent_version && !args.parent_tab) {
          if (!config.navigation.items) {
            config.navigation.items = []
          }
          targetItemsArray = config.navigation.items
        } else if (args.parent_tab) {
          let tab
          if (args.parent_version) {
            const version = config.navigation.versions?.find(
              (v) => v.version === args.parent_version
            )
            if (!version)
              return { results: { error: `Version ${args.parent_version} not found` } }
            tab = version.tabs?.find((t) => t.tab === args.parent_tab)
            if (!tab)
              return {
                results: { error: `Tab ${args.parent_tab} not found in version ${args.parent_version}` },
              }
          } else {
            tab = config.navigation.tabs?.find(
              (t) => t.tab === args.parent_tab
            )
            if (!tab) return { results: { error: `Tab ${args.parent_tab} not found` } }
          }

          if (!tab.items) {
            tab.items = []
          }
          targetItemsArray = tab.items
        } else {
          return {
            results: { error: 'A grouper must be created either at the root or within a tab.' },
          }
        }

        if (targetItemsArray) {
          const existingGroup = targetItemsArray.find(
            (g) => g.title === args.group_name
          )
          if (existingGroup) {
            return { results: { error: `A group named "${args.group_name}" already exists.` } }
          }
          targetItemsArray.push(newGrouper)
        }

        await ContentService.saveConfig(config)
        updateConfig(config)

        return { results: { success: 'true' } }
      }
      case 'create_page': {
        return addNewPage(
          args.parent_tab,
          args.parent_version,
          args.parent_group,
          args.page_name
        )
          .then((resp) => {
            return { results: { success: 'true', path: resp } }
          })
          .catch((err) => {
            return { results: { success: 'false', error: err.message } }
          })
      }
      case 'remove_item': {
        const { entity_type } = args;

        const entityTypes: Record<string, string> = {
          'version': 'deleting versions',
          'tab': 'deleting tabs',
          'group': 'deleting groups',
          'dropdown': 'deleting dropdowns',
          'page': 'deleting pages'
        };

        const operationDescription = entityTypes[entity_type] || 'deleting items';

        const message = `**${operationDescription.charAt(0).toUpperCase() + operationDescription.slice(1)} via AI is not available yet.**

This feature is coming soon! Currently, the following structural operations cannot be performed through AI:
• Renaming or deleting versions
• Renaming or deleting tabs
• Renaming or deleting groups
• Renaming or deleting pages

**You can perform these operations manually using the sidebar.** Double-click on any item to rename it, or hover and click the delete button to remove it.`;

        return {
          results: {
            success: 'false',
            not_supported: true,
            message,
            operation: 'remove_item',
            entity_type
          }
        };
      }
      case 'replace_in_file': {
        let { page, to_replace_text, new_text } = args

        // Ensure the file path has .mdx extension
        if (!page.endsWith('.mdx')) {
          page = `${page}.mdx`
        }

        try {
          if (page.endsWith('.mdx')) {
            // Handle MDX files via Tiptap structure
            const pageData = await pageLoader.loadPage(page)
            if (!pageData || !pageData.content) {
              return {
                results: {
                  success: 'false',
                  error: `Could not load page content for ${page}`,
                },
              }
            }

            const tiptapContent = pageData.content

            function traverse(node: any) {
              if (node.type === 'text' && node.text) {
                node.text = node.text.replaceAll(to_replace_text, new_text)
              }
              if (node.content && Array.isArray(node.content)) {
                node.content.forEach(traverse)
              }
            }

            traverse(tiptapContent)

            await ContentService.saveContent(page, JSON.stringify(tiptapContent))
          } else {
            // Handle other files as raw text
            const cleanPath = page.startsWith('/') ? page.slice(1) : page
            const response = await axiosInstance.post(
              `/content/api/v1/filesystem/file`,
              { path: cleanPath }
            )
            const originalContent = response.data.content

            if (typeof originalContent !== 'string') {
              return {
                results: {
                  success: 'false',
                  error: 'File content is not a string.',
                },
              }
            }

            const newContent = originalContent.replaceAll(
              to_replace_text,
              new_text
            )
            await ContentService.saveContent(page, newContent)
          }

          return { results: { success: 'true' } }
        } catch (error: any) {
          return {
            results: {
              success: 'false',
              error: `Failed to replace in file: ${error.message}`,
            },
          }
        }
      }
      case 'search': {
        const { query, max_hits } = args
        let results:SearchHit[] =[]
        await new Promise((resolve:any)=> searchService.search(query,max_hits,(result:SearchResponse)=>{
          results = [...results,...result.hits]
        },()=>{
            resolve()
        }))
        console.log(results)
       return { results: { search_results: results.slice(0, max_hits) } }
      }
      case 'create_todo': {
        const { title, description } = args;
        let { task_number } = args;
        const { currentTodoList } = uiCallbacks;

        if (!task_number) {
            if (currentTodoList && currentTodoList.trim() !== '') {
                const lines = currentTodoList.trim().split('\n');
                const lastLine = lines[lines.length - 1];
                const match = lastLine.match(/^(\d+)\./);
                if (match) {
                    task_number = parseInt(match[1], 10) + 1;
                } else {
                    task_number = 1;
                }
            } else {
                task_number = 1;
            }
        }

        const newTodoItem = `${task_number}. ${title}: ${description || 'No description.'}\n`;
        const newTodoList = currentTodoList ? currentTodoList + newTodoItem : newTodoItem;
        return { results: { success: 'true', newTodoList } };
      }
      case 'update_status': {
        const { id, status, note } = args;
        const { currentTodoList } = uiCallbacks;
        if (!currentTodoList) return { results: { success: 'false', error: "Todolist not provided"} };
        const lines = currentTodoList.split('\n');
        const updatedLines = lines.map((line: string) => {
          if (line.startsWith(`${id}.`)) {
            return `${id}. ${line.substring(String(id).length + 2).split(':')[0]}: Status: ${status}${note ? ` (${note})` : ''}`;
          }
          return line;
        });
        const newTodoList = updatedLines.join('\n');
        return { results: { success: 'true', newTodoList } };
      }
      case 'open_page':
      case 'see_page': {
        if (uiCallbacks && uiCallbacks.onUpdateContext) {
          try{
            const pagePath=`${args.url}${args.url.endsWith('.mdx')?'':'.mdx'}`
            const content = await pageLoader.loadPage(pagePath)
            if(content){
              const context: ChatContext = {
                id: `${pagePath}-${Date.now()}`,
                type: 'file',
                fileName: pagePath,
              };
              uiCallbacks.onUpdateContext(context);

              return { results: { success: 'true', content:mdxSerializer.serialize(content.content) } };
            }else{
              return { results: { success: 'false',error:'no content for that page' } };
            }
          }catch(e){
            return { results: { success: 'false',error:e } };
          }
        }else{
            return { results: { success: 'false',error:'not implemented' } };
        }
      }
      case 'replace_configuration': {
        const { page, key, value } = args;
        // This is a placeholder.
        // The actual implementation would depend on how configuration is stored.
        console.warn(`Tool "replace_configuration" is not fully implemented. Page: ${page}, Key: ${key}, Value: ${value}`);
        return { results: { success: 'true', note: 'partially implemented' } };
      }
      case 'highlight_text': {
        const { page, text, color } = args;
        // This is a placeholder.
        // This would likely involve updating the tiptap content of a page.
        console.warn(`Tool "highlight_text" is not fully implemented. Page: ${page}, Text: ${text}, Color: ${color}`);
        return { results: { success: 'true', note: 'not implemented' } };
      }
      case 'edit_global_config': {
        const { config_type } = args;

        const configTypes: Record<string, string> = {
          'navbar': 'navbar items and navigation links',
          'footer': 'footer content and links',
          'colors': 'theme colors',
          'background': 'background colors and images',
          'fonts': 'typography settings',
          'seo': 'SEO metadata',
          'analytics': 'analytics configuration',
          'social': 'social media links',
          'branding': 'branding settings',
          'logo': 'logo',
          'favicon': 'favicon',
          'banner': 'banner',
          'general': 'general configuration'
        };

        const configDescription = configTypes[config_type] || config_type || 'global configuration';

        const message = `**Editing ${configDescription} via AI is not available yet.**

This feature is coming soon! Currently, the following global settings cannot be edited through AI:
• Navbar items and navigation links
• Footer content
• Colors and background
• Logo, favicon, and banner
• SEO and analytics

**You can edit these settings manually using the Settings panel.**

[[OPEN_SETTINGS]]`;

        return {
          results: {
            success: 'false',
            not_supported: true,
            has_action: true,
            action_type: 'open_settings',
            message,
            config_type: config_type
          }
        };
      }
      case 'rename_version':
      case 'rename_tab':
      case 'rename_group':
      case 'rename_page':
      case 'remove_group':
      case 'remove_version':
      case 'remove_tab':
      case 'remove_page': {
        const operationTypes: Record<string, string> = {
          'rename_version': 'renaming versions',
          'rename_tab': 'renaming tabs',
          'rename_group': 'renaming groups',
          'rename_page': 'renaming pages',
          'remove_group': 'deleting groups',
          'remove_version': 'deleting versions',
          'remove_tab': 'deleting tabs',
          'remove_page': 'deleting pages'
        };

        const operationDescription = operationTypes[toolName] || 'this operation';

        const message = `**${operationDescription.charAt(0).toUpperCase() + operationDescription.slice(1)} via AI is not available yet.**

This feature is coming soon! Currently, the following structural operations cannot be performed through AI:
• Renaming or deleting versions
• Renaming or deleting tabs
• Renaming or deleting groups
• Renaming or deleting pages

**You can perform these operations manually using the sidebar.** Double-click on any item to rename it, or hover and click the delete button to remove it.`;

        return {
          results: {
            success: 'false',
            not_supported: true,
            message,
            operation: toolName
          }
        };
      }
      default:
        return { results: { error: `Tool ${toolName} not found` } }
    }
  },
}

const addNewPage = async (tab:string,version:string,groupTitle:string,pageName: string) => {
    if (!groupTitle) return

    const newPagePath = generatePagePath(version,tab,groupTitle, pageName)
      const config = await loadConfig()

      const items = getTabItems(config,version,tab)
      if (items) {
        for (const group of items) {
          if (group.title === groupTitle && group.children) {
            // Check if page with same name already exists
            const existingPage = group.children.find((p: any) => p.title === pageName)
            if (existingPage) {
              throw new Error(`A page named "${pageName}" already exists in this group`)
            }

            const newPage = {
              title: pageName,
              page: newPagePath,
              type: 'page'
            }
            group.children.push(newPage)
            break
          }
        }
      }

      // Save config
      await ContentService.saveConfig(config)

      // Create the JSON file with initial TipTap content structure
      const initialContent = {
        content: {
          type: 'doc',
          content: [
            {
              type: 'heading',
              attrs: { level: 1 },

              content: [
                {
                  type: 'text',
                  text: pageName
                }
              ]
            },
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'This is a new page. Start editing to add your content.'
                }
              ]
            }
          ]
        }
      }

      await ContentService.saveContent(newPagePath, JSON.stringify(initialContent.content, null, 2))

      // Update config in memory instead of reloading
      ConfigLoader.updateConfig(config)
       return newPagePath
}




  const generatePagePath = (version:string,tab:string,groupTitle: string, pageTitle: string): string => {
    const sanitize = (str: string) => str.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    return `/${version}/${sanitize(tab)}/${sanitize(groupTitle)}/${sanitize(pageTitle)}.mdx`
  }




  const getTabItems = (config: any,version:string,tab:string): any[] | null => {
    // Try versions structure first
    if (config.navigation?.versions) {
      const versionIndex = config.navigation.versions.findIndex(
        (v: any) => v.version === version
      )

      if (versionIndex !== -1) {
        const tabs = config.navigation.versions[versionIndex].tabs
        const tabIndex = tabs?.findIndex((t: any) => t.tab === tab)

        if (tabIndex !== -1 && tabIndex !== undefined) {
          return tabs[tabIndex].items || []
        }
      }
    }

    // Try direct tabs structure
    if (config.navigation?.tabs) {
      const tabIndex = config.navigation.tabs.findIndex((t: any) => t.tab === tab)

      if (tabIndex !== -1) {
        return config.navigation.tabs[tabIndex].items || []
      }
    }

    return null
  }
