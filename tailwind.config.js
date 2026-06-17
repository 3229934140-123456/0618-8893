/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        night: {
          50: "#F1F5F9",
          100: "#CBD5E1",
          200: "#94A3B8",
          300: "#64748B",
          400: "#475569",
          500: "#334155",
          600: "#1E293B",
          700: "#131C2E",
          800: "#0F172A",
          900: "#0A0F1E",
          950: "#060A14",
        },
        gold: {
          50: "#FBF6E4",
          100: "#F5ECBD",
          200: "#EFDD8F",
          300: "#E6C95E",
          400: "#D9B43A",
          500: "#C9A84C",
          600: "#A8873D",
          700: "#82662E",
          800: "#5E491F",
          900: "#3D2E14",
        },
        magic: {
          50: "#F5F3FF",
          100: "#EDE9FE",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
          800: "#5B21B6",
          900: "#4C1D95",
        },
        forge: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#F97316",
          600: "#EA580C",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
        },
      },
      fontFamily: {
        display: ["Cinzel", "serif"],
        body: ["'Noto Sans SC'", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gold-gradient":
          "linear-gradient(135deg, #E6C95E 0%, #C9A84C 50%, #A8873D 100%)",
        "magic-gradient":
          "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 50%, #6D28D9 100%)",
        "glass-dark":
          "linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)",
        "hero-pattern":
          "radial-gradient(ellipse at top, rgba(124, 58, 237, 0.15) 0%, transparent 50%), radial-gradient(ellipse at bottom, rgba(201, 168, 76, 0.1) 0%, transparent 50%)",
      },
      boxShadow: {
        gold: "0 0 20px rgba(201, 168, 76, 0.3), 0 0 40px rgba(201, 168, 76, 0.1)",
        magic: "0 0 20px rgba(124, 58, 237, 0.3), 0 0 40px rgba(124, 58, 237, 0.1)",
        card: "0 4px 24px rgba(0, 0, 0, 0.4)",
        "card-hover":
          "0 8px 32px rgba(201, 168, 76, 0.15), 0 0 0 1px rgba(201, 168, 76, 0.2)",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.5s ease-out forwards",
        "pulse-gold": "pulseGold 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(201, 168, 76, 0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(201, 168, 76, 0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
