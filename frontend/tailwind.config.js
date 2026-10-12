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
        cyber: {
          dark: '#080c14',
          panel: '#0f172a',
          card: '#131d33',
          cardHover: '#182442',
          border: '#1e293b',
          accent: '#06b6d4',
          accentHover: '#0891b2',
          teal: '#14b8a6',
          sky: '#38bdf8',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#f43f5e',
          textMuted: '#94a3b8',
          textBright: '#f1f5f9',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -5px rgba(6, 182, 212, 0.25)',
        'glow-danger': '0 0 20px -5px rgba(244, 63, 94, 0.25)',
        'glow-success': '0 0 20px -5px rgba(16, 185, 129, 0.25)',
        'glow-warning': '0 0 20px -5px rgba(245, 158, 11, 0.25)',
      }
    },
  },
  plugins: [],
}
