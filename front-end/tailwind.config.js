/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'bg-[#DB4444]',
    'hover:bg-[#fff5f5]',
    'hover:text-[#DB4444]',
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1170px',
      },
    },
    extend: {
      colors: {
        // Định nghĩa màu custom 'brand' hoặc 'myprimary'
        brand: '#DB4444',
        myprimary: '#DB4444',
      },
      animation: {
        'loading-bar': 'loading 2s ease-in-out infinite',
      },
      keyframes: {
        loading: {
          '0%': { width: '0%' },
          '50%': { width: '80%' },
          '100%': { width: '0%' },
        },
      },
    },
  },
  plugins: [],
};
