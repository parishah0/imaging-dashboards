/** @type {import('tailwindcss').Config} */
export default {
  /* 1️⃣  Enable class‑based dark mode so you can toggle with <body class="dark"> */
  darkMode: 'class',

  /* 2️⃣  Tell Tailwind where to look for class names */
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],

  /* 3️⃣  Theme overrides & custom tokens */
  theme: {
    extend: {
      colors: {
        /* Backgrounds */
        bg:       '#0f172a',   // dark navy
        surface:  '#1e293b',   // slightly lighter cards / panels

        /* Accent colors */
        primary:  '#06b6d4',   // teal
        primary2: '#22d3ee',   // lighter teal (hover / gradient)
      },
      borderRadius: {
        xl2: '1.25rem',        // 20 px, used for cards
      },
    },
  },

  /* 4️⃣  No extra plugins for now */
  plugins: [],
};
