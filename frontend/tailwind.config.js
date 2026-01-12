/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#15BB73',  // green
        dark: '#000600',     // black
        light: '#FEFEFE',    // white
        background: '#E9F0F8', // background color
      },
      fontFamily: {
        'sans': ['Noto Sans', 'Noto Sans Devanagari', 'system-ui', 'sans-serif'],
        'devanagari': ['Noto Sans Devanagari', 'Noto Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
