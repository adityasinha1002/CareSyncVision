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
          50:  '#fdf2f2',
          100: '#fce4e4',
          200: '#f9cccc',
          300: '#f4a5a5',
          400: '#ec7070',
          500: '#df4242',
          600: '#9f1211',
          700: '#861010',
          800: '#6e0d0d',
          900: '#5a0b0b',
          950: '#3a0707',
        },
      },
      boxShadow: {
        'soft': '0 1px 3px 0 rgba(0,0,0,0.08)',
        'medium': '0 4px 12px -1px rgba(0,0,0,0.10)',
        'lg': '0 10px 30px -3px rgba(0,0,0,0.12)',
        'xl': '0 20px 40px -4px rgba(0,0,0,0.15)',
        'red': '0 4px 14px 0 rgba(159,18,17,0.3)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
