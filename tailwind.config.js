/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable dark mode via a class (e.g., adding 'dark' to <html>)
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#your-primary-color', // Replace with your desired primary color
          light: '#lighter-shade-of-primary',
          dark: '#darker-shade-of-primary'
        }
      }
    },
  },
  plugins: [],
}
