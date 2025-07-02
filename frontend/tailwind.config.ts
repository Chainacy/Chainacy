import type { Config } from 'tailwindcss';

const config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    'text-chainacy-blue',
    'font-chainacy',
  ],
  theme: {
    screens: {
      'xs': '480px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        'chainacy-blue': '#205a99',
        'brand-primary': '#205a99',
        primary: {
          50: '#f0f8ff',
          100: '#e0f2fe',
          500: '#2a7ae2',
          600: '#205a99',
          700: '#1e3a8a',
        },
        secondary: {
          400: '#70b7f8',
          500: '#2d8ae8',
        },
      },
      fontFamily: {
        'chainacy': ['var(--font-orbitron)', 'Orbitron', 'Arial', 'sans-serif'],
        orbitron: ['var(--font-orbitron)', 'Orbitron', 'Arial', 'sans-serif'],
        sans: ['Arial', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};

export default config;
