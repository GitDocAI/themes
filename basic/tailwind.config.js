/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./content/**/*.{js,ts,jsx,tsx}', '*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  important: '#__next',
  theme: {
   darkMode: 'class',
    extend: {
      colors: {
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        background: 'rgb(var(--color-bg) / <alpha-value>)',
      },
    },
 gridTemplateAreas: {
      'layout': [
        'header header',
        'sidebar content',
        'footer footer',
      ],
    },
  },
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
