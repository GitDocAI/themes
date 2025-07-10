import nextra from 'nextra'
import fs from 'fs'
import path from 'path'

const configPath = path.join(process.cwd(), 'dockitai.config.json')

let siteConfig = {}

try {
  const raw = fs.readFileSync(configPath, 'utf-8')
  siteConfig = JSON.parse(raw)
} catch (err) {
  console.warn('Error reading dockitai.config.json')
}

const withNextra = nextra({
  staticImage: true,
})


export default withNextra({
  env: {
    SITE_CONFIG: JSON.stringify(siteConfig),
  },
})
