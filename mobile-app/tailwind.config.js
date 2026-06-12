/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff0f1',
          100: '#ffe3e5',
          200: '#ffcdd1',
          300: '#ffaaaf',
          400: '#ff7781',
          500: '#f85a65', // Main brand color
          600: '#e53e4b',
          700: '#c12833',
          800: '#a1232d',
          900: '#86222a',
        }
      }
    },
  },
  plugins: [],
}
