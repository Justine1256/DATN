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
};