import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#990000",
        "primary-glow": "rgba(153, 0, 0, 0.15)",
        background: "#ffffff",
        surface: "#f8f9fa",
        "surface-light": "#ffffff",
        "on-background": "#0a0a0a",
        "on-background-muted": "#52525b",
      },
      fontFamily: {
        display: ["var(--font-sora)", "sans-serif"],
        body: ["var(--font-geist)", "sans-serif"],
      },
      animation: {
        "fade-in-up": "fadeInUp 1s ease-out forwards",
        "marquee": "marquee 30s linear infinite",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-100%)" },
        }
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
export default config;
