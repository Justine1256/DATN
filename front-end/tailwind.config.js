// tailwind.config.js

import tailwindScrollbarHide from "tailwind-scrollbar-hide";

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        "loading-bar": "loading 2s ease-in-out infinite",
      },
      keyframes: {
        loading: {
          "0%": { width: "0%" },
          "50%": { width: "80%" },
          "100%": { width: "0%" },
        },
      },
      plugins: [tailwindScrollbarHide],
      fontSize: {
        base: '1rem',        // 16px (body)
        'sm-detail': '0.875rem', // 14px
        'h1': '2.25rem',     // 36px
        'h2': '1.5rem',      // 24px
        'h3': '1.25rem',     // 20px
      },
    },
  },
};
