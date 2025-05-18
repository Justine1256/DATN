// tailwind.config.js

module.exports = {
    theme: {
      extend: {
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
  