import nextra from 'nextra';
import fs from 'fs';
import path from 'path';
import { init } from './shared/file_indexer/init_search_engine';
import { openapi_path_builder } from './shared/path_builder';

const configPath = path.join(process.cwd(), 'gitdocai.config.json');

const withNextra = nextra({
  staticImage: true,
});

export default async function config() {
  await init();

  let siteConfig = {};
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    siteConfig = openapi_path_builder(JSON.parse(raw));
  } catch (err) {
    console.warn('Error reading gitdocai.config.json');
  }

  return withNextra({
    env: {
      SITE_CONFIG: JSON.stringify(siteConfig),
    },
  });
}



