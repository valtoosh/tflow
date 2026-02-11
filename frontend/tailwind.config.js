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
        primary: {
          DEFAULT: '#F2541B',
          hover: '#D9420D',
        },
        background: {
          light: '#F8F9FA',
          dark: '#221910', // Warm dark brown from reference
        },
        surface: {
          light: '#FFFFFF',
          dark: '#2c2117', // Dark surface from reference
          'dark-2': '#3d2e20', // Lighter dark surface
        },
        accent: {
          dark: '#3d2e20',
        },
        border: {
          light: '#E5E7EB',
          dark: '#3d2e20', // Warm border
        },
        text: {
          light: '#1F2937',
          dark: '#F3F4F6',
          'muted-light': '#6B7280',
          'muted-dark': '#9ca3af', // Lighter muted text for better contrast
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 20px -5px rgba(242, 84, 27, 0.4)',
        'glow-hover': '0 0 30px -5px rgba(242, 84, 27, 0.6)',
      },
    },
  },
  plugins: [],
}
