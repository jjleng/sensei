import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'media',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#00B0D8',
          DEFAULT: '#00B0D8',
          dark: '#00B0D8',
        },
        text: {
          light: '#13343B',
          DEFAULT: '#13343B',
          dark: '#E8E8E6',
        },
      },
    },
  },
  plugins: [],
};
export default config;
