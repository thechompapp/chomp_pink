// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}', // Include all JS/JSX/TS/TSX files in src
    '!./src/**/node_modules/**/*', // Exclude node_modules
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};