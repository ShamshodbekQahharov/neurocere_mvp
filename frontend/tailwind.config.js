/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#EBF3FB',
          100: '#D6E4F0',
          500: '#2E75B6',
          600: '#1A3C6E',
          700: '#142d54'
        },
        success: {
          50:  '#D4EDDA',
          500: '#1E7A4E'
        },
        warning: {
          50:  '#FFF0E0',
          500: '#C45C00'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
