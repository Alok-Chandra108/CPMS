/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#635BFF', // Stripe Blurple
          'primary-light': '#E8E5FF',
          'primary-dark': '#5851E5',
        },
        stripe: {
          bg: '#F6F9FC', // Stripe System Background
          card: '#FFFFFF', // Solid White
          text: '#0A2540', // Stripe Deep Slate
          textSecondary: '#425466', // Stripe Slate Gray
          border: '#E3E8EE', // Stripe Soft Border
          whiteBorder: '#E3E8EE', // Fallback for old code
        },
        success: '#00D924',
        error: '#DF1B41',
        warning: '#FF8A00',
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glass': '0 15px 35px rgba(50,50,93,0.1), 0 5px 15px rgba(0,0,0,0.07)', // Override old glass shadow
        'glass-hover': '0 18px 35px rgba(50,50,93,0.15), 0 8px 15px rgba(0,0,0,0.1)', // Override old glass shadow
        'stripe-card': '0 15px 35px rgba(50,50,93,0.1), 0 5px 15px rgba(0,0,0,0.07)',
        'stripe-hover': '0 18px 35px rgba(50,50,93,0.15), 0 8px 15px rgba(0,0,0,0.1)',
        'stripe-sm': '0 4px 6px rgba(50,50,93,0.11), 0 1px 3px rgba(0,0,0,0.08)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
