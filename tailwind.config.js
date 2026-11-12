/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        tg: {
          blue: '#2481cc',
          'blue-dark': '#1e72b4',
          'blue-light': '#50a7ea',
          bg: '#0f172a',
          sidebar: '#17212b',
          chat: '#0e1621',
          panel: '#242f3d',
          input: '#17212b',
          bubbleOut: '#2b5278',
          bubbleIn: '#182533',
          border: '#232e3c',
          textMuted: '#708499',
          accent: '#2f6ea5'
        }
      }
    },
  },
  plugins: [],
}
