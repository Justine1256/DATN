/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./app/**/*.{js,ts,jsx,tsx}",
    ],
    safelist: [
        "bg-[#DB4444]",
        "hover:bg-[#fff5f5]",
        "hover:text-[#DB4444]",
    ],
    theme: {
        container: {
            center: true, // Canh giữa container
            padding: "0rem", // Padding cho container
            screens: {
                sm: "640px", // Màn hình nhỏ (sm)
                md: "768px", // Màn hình trung bình (md)
                lg: "1024px", // Màn hình lớn (lg)
                xl: "1170px", // Màn hình extra lớn (xl)
            },
        },
        extend: {
            colors: {
                // Định nghĩa màu custom 'brand' hoặc 'myprimary'
                brand: "#DB4444", // Màu thương hiệu
            },
            fontFamily: {
                sans: ["Montserrat", "sans-serif"], // Sử dụng font Montserrat
            },
            animation: {
                "loading-bar": "loading 2s ease-in-out infinite", // Hiệu ứng loading bar
            },
            keyframes: {
                loading: {
                    "0%": { width: "0%" },
                    "50%": { width: "80%" },
                    "100%": { width: "0%" },
                },
            },
            fontSize: {
                base: "1rem", // 16px (body)
                "sm-detail": "0.875rem", // 14px
                h1: "2.25rem", // 36px (Tiêu đề cấp 1)
                h2: "1.5rem", // 24px (Tiêu đề cấp 2)
                h3: "1.25rem", // 20px (Tiêu đề cấp 3)
            },
        },
    },
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    // plugins: [require("@tailwindcss/line-clamp")], // Plugin cho line-clamp nếu cần
};
