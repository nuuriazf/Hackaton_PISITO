/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#e6f4ff",
          100: "#b8dfff",
          200: "#7ac3ff",
          300: "#5cb6ff",
          400: "#2ea1ff",
          500: "#13505B",
          600: "#0073d1",
          700: "#13505B",
          800: "#004175",
          900: "#002747",
          950: "#000e1a"
        },
        ink: {
          900: "#10263f",
          800: "#173452",
          700: "#274769",
          600: "#425f80",
          500: "#5a7594"
        }
      },
      fontFamily: {
        sans: ["Avenir Next", "Segoe UI", "Trebuchet MS", "sans-serif"]
      },
      fontSize: {
        display: ["2rem", { lineHeight: "2.3rem", letterSpacing: "-0.02em", fontWeight: "700" }],
        title: ["1.5rem", { lineHeight: "1.9rem", letterSpacing: "-0.01em", fontWeight: "700" }],
        body: ["0.95rem", { lineHeight: "1.4rem" }]
      },
      borderRadius: {
        card: "1rem",
        control: "0.75rem"
      },
      boxShadow: {
        card: "0 18px 44px rgba(16, 38, 63, 0.12)"
      }
    }
  },
  plugins: []
};
