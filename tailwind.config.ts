import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#07070a",
        foreground: "#f8f9ff",
        accent: {
          DEFAULT: "#6f4ff2",
          lime: "#7fffd4"
        }
      },
      boxShadow: {
        glow: "0 0 40px rgba(111, 79, 242, 0.45)"
      }
    }
  },
  plugins: []
};

export default config;
