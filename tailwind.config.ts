import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        carvao: "#161616",
        superficie: "#1F1F1F",
        borda: "#363636",
        laranja: "#FF4C21",
        texto: "#F5F5F5",
        suave: "#B8B8B8",
      },
      fontFamily: { sans: ["var(--font-montserrat)", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
