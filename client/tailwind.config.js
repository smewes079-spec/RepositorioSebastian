/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#1A1A2E',
        gold: '#C9A96E',
        cream: '#FAFAF8',
        card: '#FFFFFF',
        ink: '#2C2420',
        blush: '#CEC6C3',
        success: '#5C8C6A',
        danger: '#A85C52',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
