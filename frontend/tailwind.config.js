/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fbf6f0',
          100: '#f5e8d8',
          200: '#ebd0b0',
          300: '#dcb080',
          400: '#c98c50',
          500: '#b8742f',
          600: '#a05f24',
          700: '#824b1e',
          800: '#6b3e1e',
          900: '#5a361c',
          950: '#321b0d',
        },
        sage: {
          50: '#f4f7f4',
          100: '#e6ede6',
          200: '#cedccd',
          300: '#aac2a8',
          400: '#82a47f',
          500: '#638a60',
          600: '#4d704b',
          700: '#3e593d',
          800: '#334833',
          900: '#2b3c2b',
          950: '#162216',
        },
        accent: {
          50: '#fdfbf3',
          100: '#faf3e0',
          200: '#f4e6bb',
          300: '#ecd28a',
          400: '#e3b85a',
          500: '#d9a03c',
          600: '#c0832f',
          700: '#9d6328',
          800: '#814f28',
          900: '#6c4226',
        },
        cream: '#faf7f2',
        warmwhite: '#fdfcf9',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'serif'],
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'fade-up': 'fadeUp 0.6s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
