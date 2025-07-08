/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./content/**/*.{js,ts,jsx,tsx}', '*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  important: '#__next',
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        background: 'rgb(var(--color-bg) / <alpha-value>)',
      },
    }
  },
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

