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
        nexa: {
          dark: '#0B0F19',
          card: '#111827',
          cardHover: '#1F293D',
          border: 'rgba(255, 255, 255, 0.08)',
          primary: '#3B82F6',
          primaryHover: '#2563EB',
          accent: '#10B981',
          gold: '#F59E0B',
          purple: '#8B5CF6',
          muted: '#94A3B8'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'neon-blue': '0 0 20px rgba(59, 130, 246, 0.35)',
        'neon-green': '0 0 20px rgba(16, 185, 129, 0.35)',
      }
    },
  },
  plugins: [],
}
