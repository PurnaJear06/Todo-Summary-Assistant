/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          dark: '#141b33',
          DEFAULT: '#1c2444',
          light: '#2c3659'
        },
        primary: {
          DEFAULT: '#4e62e9',
          hover: '#3a4fda'
        }
      }
    },
  },
  plugins: [],
} 