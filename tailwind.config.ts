import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)", // CSS variable for background
        foreground: "var(--foreground)", // CSS variable for foreground
        primary: "#1E90FF", // Vibrant blue for buttons
        secondary: "#F5F5F5", // Light gray background
      },
    },
  },
  plugins: [],
} satisfies Config;