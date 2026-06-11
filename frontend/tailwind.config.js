/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0f',
        primary: '#1a472a',
        accent: '#c9a227',
        card: '#12121a',
        'card-hover': '#1a1a28',
        border: '#2a2a3a',
      },
    },
  },
  plugins: [],
}
