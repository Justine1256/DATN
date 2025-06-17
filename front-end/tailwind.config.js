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
            center: true,
            padding: "0rem",
            screens: {
                sm: "640px",
                md: "768px",
                lg: "1024px",
                xl: "1170px",
            },
        },
        extend: {
            colors: {
                brand: "#DB4444",
                customGray: "#f0f0f0", // Example of another custom color
            },
            fontFamily: {
                sans: ["Montserrat", "sans-serif"],
            },
            animation: {
                "loading-bar": "loading 2s ease-in-out infinite",
                fadeIn: "fadeIn 0.3s ease-out",
                bounce: "bounce 0.5s ease-in-out",
                scaleIn: "scaleIn 0.3s ease-out", // ✅ thêm animation scaleIn
                "spin-slow": "spin 1s linear infinite",
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
                scaleIn: { // ✅ định nghĩa keyframe scaleIn
                    "0%": { opacity: 0, transform: "scale(0.8)" },
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
};
  