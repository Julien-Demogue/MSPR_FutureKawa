/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        kawa: {
          bg: '#FDFBF7',
          header: '#EBDBC9',
          headerBorder: '#D8C5B1',
          sidebar: '#4A3022',
          sidebarHover: '#634533',
          accent: '#8C6239',
        },
      },
    },
  },
  plugins: [],
};