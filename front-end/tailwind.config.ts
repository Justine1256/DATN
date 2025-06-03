import type { Config } from "tailwindcss";

const config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx,js,jsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "0rem",  // Mặc định: mobile
        sm: "2rem",       // >=640px
        lg: "4rem",       // >=1024px
      },
      screens: {
        "lg": "1170px",
      },
},
    extend: {
      fontFamily: {
      sans: ['var(--font-inter)', 'sans-serif'],
    },
      backgroundImage: {
        "hero-gradient": "bg-[#DB4444]",
        "hero-gradient-2": "linear-gradient(to bottom, #18734C, #004742)",
        "button": "linear-gradient(to bottom, #3D9D73, #18695C)",
        "button-hover": "linear-gradient(to bottom, #18695C, #3D9D73)"
      },

        fontSize: {
        xs: "12px",
        sm: "14px",
        base: "16px",
        lg: "18px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "28px",
        "4xl": "32px",
        "5xl": "36px",
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // Các màu dùng chung trong toàn dự án
        brand: {
          light: "#e0f2ec",
          DEFAULT: "#DB4444",
          dark: "#063f2e",
        },
        success: {
          light: "#d1fae5",
          DEFAULT: "#10b981",
          dark: "#065f46",
        },
        warning: {
          light: "#fef3c7",
          DEFAULT: "#f59e0b",
          dark: "#b45309",
        },
        error: {
          light: "#fee2e2",
          DEFAULT: "#ef4444",
          dark: "#991b1b",
        },
        neutral: {
          light: "#f5f5f5",
          DEFAULT: "#9ca3af",
          dark: "#111827",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        bounce: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "scale(0)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        bounce: "bounce 0.5s ease-in-out",
        fadeIn: "fadeIn 0.3s ease-out",
      },
    },
  },
  plugins: [
  require("tailwindcss-animate"),
  require("@tailwindcss/line-clamp"),
  require("@tailwindcss/typography"),
],

} satisfies Config;

export default config;