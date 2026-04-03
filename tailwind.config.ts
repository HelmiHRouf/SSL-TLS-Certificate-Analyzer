import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0F6E56",
          light: "#E1F5EE",
        },
        learn: {
          DEFAULT: "#534AB7",
        },
        grade: {
          "a-text": "#27500A",
          "a-bg": "#EAF3DE",
          "b-text": "#633806",
          "b-bg": "#FAEEDA",
          "cf-text": "#791F1F",
          "cf-bg": "#FCEBEB",
        },
      },
    },
  },
  plugins: [],
};

export default config;
