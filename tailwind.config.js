/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 50: '#eef3fb', 100: '#d6e2f5', 200: '#adc4ea', 500: '#2f5aa8', 600: '#1f4689', 700: '#17366b', 800: '#102850', 900: '#0b1d3a' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'] },
      boxShadow: { panel: '0 4px 20px -4px rgba(11,29,58,0.18)' },
    },
  },
  plugins: [],
};
