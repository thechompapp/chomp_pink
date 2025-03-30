/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}", // Include JS, JSX, TS, and TSX files, but exclude node_modules implicitly
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}