import nextra from 'nextra';
import fs from 'fs';
import path from 'path';
import { index_content_files } from './chunker/content_analizer';
import { generateTfIdfMatrix } from './tfidf/vectorizer';
import { saveSVDResults } from './svd/saveResults';

const configPath = path.join(process.cwd(), 'gitdocai.config.json');

let siteConfig = {};

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
