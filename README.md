# DockitAIThemes
# 🛠️ Guía de `site.config.js` en tu proyecto Nextra

El archivo `site.config.js` sirve como **centro de configuración global** para personalizar tu sitio web. Aquí defines valores importantes como el nombre del sitio, el logo, versiones disponibles, y más.

---

## 📄 Ejemplo de `site.config.js`

```js
export default {
  logo: 'https://www.shopify.com/stock-photos',
  name: 'Example',
  versions: ['v1.0', 'v2.1'],
  github: "https://github.com/shuding/nextra/tree/main/docs",
  defaultVersion: 'v1.0'
}
