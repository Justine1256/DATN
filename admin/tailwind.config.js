/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            lineClamp: {
                2: '2', // Thêm hỗ trợ line-clamp-2 cho Tailwind CSS
            },
        },
    },
    plugins: [],
}