/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./globals.css", // Ensure this path is correct if you have a global CSS file
    ],
    theme: {
        extend: {
            // Custom brand color for consistency
            colors: {
                brand: {
                    500: '#db4444', // Your brand color
                },
            },
            // Extend line clamp utility
            lineClamp: {
                2: '2',
            },
            // Define custom keyframe animations
            keyframes: {
                'fade-in': {
                    '0%': { opacity: 0, transform: 'translateY(10px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' },
                },
                'slide-in': {
                    '0%': { transform: 'translateY(-20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
            // Apply custom animations
            animation: {
                'fade-in': 'fade-in 0.5s ease-out',
                'slide-in': 'slide-in 0.3s ease-out forwards', // For the popup, ensuring it stays visible
            },
        },
    },
    plugins: [
        // Add plugins if needed, for example:
        // require('@tailwindcss/forms'),
        // require('@tailwindcss/line-clamp'), // If lineClamp utility is not natively supported or needs specific plugin
    ],
}