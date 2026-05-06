/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0B3C5D",
        secondary: "#FFFFFF",
        alert: "#D72638",
      },
    },
  },
  plugins: [],
};

