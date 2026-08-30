import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        urdu: ["Noto Nastaliq Urdu", "serif"],
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
          50: "hsl(150 45% 96%)",
          100: "hsl(150 40% 90%)",
          200: "hsl(150 38% 80%)",
          300: "hsl(150 40% 65%)",
          400: "hsl(150 48% 52%)",
          500: "hsl(150 55% 40%)",
          600: "hsl(152 60% 32%)",
          700: "hsl(152 65% 25%)",
          800: "hsl(153 65% 19%)",
          900: "hsl(154 68% 13%)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
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
        good: {
          DEFAULT: "hsl(var(--good))",
          foreground: "hsl(var(--good) / 0.08)",
        },
        warn: {
          DEFAULT: "hsl(var(--warn))",
        },
        risk: {
          DEFAULT: "hsl(var(--risk))",
        },
        bubble: {
          user: "hsl(var(--bubble-user))",
        },
        tick: "hsl(var(--tick))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
        bubble: "1.15rem",
      },
      boxShadow: {
        card: "0 1px 2px hsl(160 30% 20% / 0.06), 0 4px 16px hsl(160 30% 20% / 0.07)",
        "card-hover":
          "0 2px 4px hsl(160 30% 20% / 0.08), 0 8px 24px hsl(160 30% 20% / 0.12)",
        glow: "0 6px 24px hsl(152 65% 30% / 0.35)",
        ticker: "0 2px 8px hsl(154 68% 13% / 0.35)",
        sheet: "0 -12px 40px hsl(154 68% 13% / 0.25)",
      },
      keyframes: {
        "msg-in": {
          "0%": { opacity: "0", transform: "translateY(10px) scale(0.97)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        typing: {
          "0%, 60%, 100%": { transform: "translateY(0)", opacity: "0.35" },
          "30%": { transform: "translateY(-4px)", opacity: "1" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "bar-grow": {
          "0%": { width: "0%" },
          "100%": { width: "var(--bar-w)" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "70%": { transform: "scale(1.03)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "msg-in": "msg-in 0.28s cubic-bezier(0.21, 1.02, 0.73, 1) both",
        "fade-up": "fade-up 0.35s ease-out both",
        typing: "typing 1.1s ease-in-out infinite",
        marquee: "marquee 28s linear infinite",
        "pulse-dot": "pulse-dot 1.6s ease-in-out infinite",
        shimmer: "shimmer 1.4s linear infinite",
        "bar-grow": "bar-grow 0.9s cubic-bezier(0.22, 1, 0.36, 1) both",
        "pop-in": "pop-in 0.35s cubic-bezier(0.21, 1.02, 0.73, 1) both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
