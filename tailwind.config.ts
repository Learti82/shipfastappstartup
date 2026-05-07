import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#F7F5F0",
          100: "#EFEBDF",
          900: "#0E0C0A",
          950: "#070605",
        },
        accent: {
          DEFAULT: "#B8763E",
          dark: "#8C5526",
        },
      },
      fontFamily: {
        serif: ["'Fraunces'", "Georgia", "serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
