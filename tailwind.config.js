/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"], // Scan all JS/JSX/TS/TSX files in src/
  theme: {
    extend: {
      colors: {
        primary: '#D1B399',
        'primary-dark': '#b89e89',
      },
    },
  },
  plugins: [],
};