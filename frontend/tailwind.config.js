const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx,css}",
    "./src/styles/**/*.{css,scss}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Roboto', 'sans-serif', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        primary: {
          DEFAULT: '#76b900',
          50:  '#f4fce6',
          100: '#e2f5b3',
          200: '#c9eb7a',
          300: '#b0e241',
          400: '#97d808',
          500: '#76b900',
          600: '#76b900',
          700: '#5a8c00',
          800: '#3d5f00',
          900: '#213300',
        },
      },
      boxShadow: {
        'soft':   '0 1px 3px 0 rgba(0, 0, 0, 0.4)',
        'medium': '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
        'lg':     '0 10px 15px -3px rgba(0, 0, 0, 0.6)',
        'green':  '0 0 16px rgba(118, 185, 0, 0.4)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
