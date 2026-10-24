const palette = (name) => `rgb(var(--palette-${name}) / <alpha-value>)`;

const greens = {
  50: '#f1f7f2', 100: '#e3f0e7', 200: '#c4dfcd', 300: '#94c6a7',
  400: '#57a478', 500: '#16835b', 600: palette('primary'),
  700: palette('primary-hover'), 800: palette('forest'), 900: '#123c2e', 950: '#09271c',
};
const neutrals = {
  50: '#f7f9f6', 100: '#eef3ee', 200: palette('line'), 300: '#bfcec3',
  400: '#879e8e', 500: palette('muted'), 600: '#4c6355', 700: '#375440',
  800: '#294536', 900: palette('ink'), 950: '#10251b',
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: palette('primary'),
        'primary-hover': palette('primary-hover'),
        forest: palette('forest'),
        ink: palette('ink'),
        muted: palette('muted'),
        canvas: palette('canvas'),
        surface: palette('surface'),
        cream: palette('cream'),
        gold: palette('gold'),
        line: palette('line'),
        dark: palette('ink'),
        light: palette('surface'),
        background: palette('canvas'),
        green: greens,
        emerald: greens,
        teal: greens,
        gray: neutrals,
        slate: neutrals,
      },
      fontFamily: {
        'sans': ['Noto Sans', 'Noto Sans Devanagari', 'system-ui', 'sans-serif'],
        'devanagari': ['Noto Sans Devanagari', 'Noto Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
