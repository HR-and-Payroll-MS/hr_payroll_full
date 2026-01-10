/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#121828',
        eyob:'#000000',
        secondary: '#329A75',
        accent: '#F97316',
      },
    },
  },
  plugins: [],
}
