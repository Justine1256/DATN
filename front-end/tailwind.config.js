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
                brand: "#DB4444",
            },
            fontFamily: {
                sans: ["Montserrat", "sans-serif"],
            },
            animation: {
                "loading-bar": "loading 2s ease-in-out infinite",
                fadeIn: "fadeIn 0.3s ease-out",
                bounce: "bounce 0.5s ease-in-out",
            },
            keyframes: {
                loading: {
                    "0%": { width: "0%" },
                    "50%": { width: "80%" },
                    "100%": { width: "0%" },
                },
                fadeIn: {
                    "0%": { opacity: 0, transform: "scale(0.95)" },
                    "100%": { opacity: 1, transform: "scale(1)" },
                },
            },
            fontSize: {
                base: "1rem",
                "sm-detail": "0.875rem",
                h1: "2.25rem",
                h2: "1.5rem",
                h3: "1.25rem",
            },
        },
          
    },
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    // plugins: [require("@tailwindcss/line-clamp")], // Plugin cho line-clamp nếu cần
};
