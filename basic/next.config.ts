import nextra from 'nextra';
import fs from 'fs';
import path from 'path';
import {init} from './shared/file_indexer/init_search_engine'

const configPath = path.join(process.cwd(), 'gitdocai.config.json');

let siteConfig = {};

init().then(resp=>{
})

try {
  const raw = fs.readFileSync(configPath, 'utf-8');
  siteConfig = JSON.parse(raw);
} catch (err) {
  console.warn('Error reading gitdocai.config.json');
}

const withNextra = nextra({
  staticImage: true,
});

export default withNextra({
  env: {
    SITE_CONFIG: JSON.stringify(siteConfig),
  },
});
