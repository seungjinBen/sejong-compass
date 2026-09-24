import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#C8102E',
        'primary-light': '#FDECEE',
        'primary-dark': '#A00D25',
        ink: '#1F2937',
        success: '#16A34A',
        warn: '#F59E0B',
        danger: '#DC2626',
        background: '#F9FAFB',
        card: '#FFFFFF',
        dark: '#1F2937',
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
