import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        montserrat: ['var(--font-montserrat)', 'sans-serif'],
        inter: ['var(--font-inter)', 'sans-serif'],
      },
      colors: {
        primary: '#E8622C',
        'primary-deep': '#CC4010',
        brand: {
          black: '#111111',
          orange: '#E8622C',
        },
      },
      borderRadius: {
        '2xl': '20px',
      },
    },
  },
  plugins: [],
};

export default config;
