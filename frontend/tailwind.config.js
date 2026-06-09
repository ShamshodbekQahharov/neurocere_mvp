/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0d1f3c',
          light:   '#1a3460',
          dark:    '#080f1e',
        },
        teal: {
          DEFAULT: '#0e9f8e',
          light:   '#12c4b0',
          dark:    '#0a7a6d',
          50:      '#e6f9f7',
          100:     '#b3ede9',
        },
        cream: {
          DEFAULT: '#f7f3ee',
          dark:    '#f0e9df',
        },
        gold:  '#e8a838',
        muted: '#6b7a99',
      },
      fontFamily: {
        serif: ['DM Serif Display', 'Georgia', 'serif'],
        sans:  ['DM Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        teal:  '0 8px 32px rgba(14,159,142,0.25)',
        navy:  '0 8px 32px rgba(13,31,60,0.20)',
        float: '0 20px 60px rgba(13,31,60,0.15)',
        '3d':  '4px 4px 0px rgba(13,31,60,0.15)',
      },
      animation: {
        'float':       'float 3s ease-in-out infinite',
        'float-delay': 'float 3s ease-in-out 1s infinite',
        'gradient':    'gradientShift 8s ease infinite',
        'pulse-glow':  'pulseGlow 2s infinite',
        'fade-up':     'fadeUp 0.6s ease forwards',
        'shimmer':     'shimmer 1.5s infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
