/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        // Brand gradients
        brand: {
          purple: "#7C3AED",
          violet: "#8B5CF6",
          indigo: "#4F46E5",
          cyan: "#06B6D4",
          emerald: "#10B981",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "hero-gradient": "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
        "card-gradient": "linear-gradient(135deg, rgba(124,58,237,0.1), rgba(79,70,229,0.1))",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "shimmer": "shimmer 2s infinite",
        "spin-slow": "spin 4s linear infinite",
        "gradient-shift": "gradientShift 8s ease infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 10px rgba(124, 58, 237, 0.3)" },
          "100%": { boxShadow: "0 0 30px rgba(124, 58, 237, 0.8)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        gradientShift: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      opacity: {
        "2": "0.02",
        "3": "0.03",
        "8": "0.08",
        "15": "0.15",
        "25": "0.25",
        "35": "0.35",
        "45": "0.45",
        "55": "0.55",
        "65": "0.65",
        "85": "0.85",
        "98": "0.98",
      },
    },
  },
  safelist: [
    // Non-standard bg opacity values used inline across components
    "bg-foreground/2",
    "bg-foreground/3",
    "bg-foreground/8",
    "bg-foreground/15",
    "bg-black/2",
    "bg-black/3",
    "border-foreground/8",
    "border-foreground/15",
    "focus:bg-foreground/8",
    "hover:bg-foreground/3",
    "hover:border-foreground/15",
    "from-violet-500/15",
    "to-indigo-500/15",
    // Dynamic method color classes from getMethodColor() in utils.ts
    "bg-emerald-500/15", "text-emerald-400", "border-emerald-500/20",
    "bg-blue-500/15",   "text-blue-400",    "border-blue-500/20",
    "bg-amber-500/15",  "text-amber-400",   "border-amber-500/20",
    "bg-orange-500/15", "text-orange-400",  "border-orange-500/20",
    "bg-red-500/15",    "text-red-400",     "border-red-500/20",
    "bg-gray-500/15",   "text-gray-400",    "border-gray-500/20",
    "bg-violet-500/15",
    "placeholder-foreground/25",
  ],
  plugins: [],
};
