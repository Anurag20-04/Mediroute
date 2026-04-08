
/** @type {import('tailwindcss').Config} */

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {

      /* =========================
         FONT SYSTEM
      ========================= */
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },

      /* =========================
         MEDICAL COLOR SYSTEM
      ========================= */
      colors: {
        primary: {
          DEFAULT: '#0d9488',   // medical teal
          light: '#14b8a6',
          dark: '#0f766e',
        },

        glass: {
          bg: 'rgba(255,255,255,0.55)',
          strong: 'rgba(255,255,255,0.75)',
          border: 'rgba(255,255,255,0.35)',
        },

        medical: {
          emergency: '#dc2626',
          warning: '#d97706',
          success: '#059669',
          info: '#2563eb',
        },

        text: {
          primary: '#0f172a',
          secondary: '#334155',
          muted: '#64748b',
        }
      },

      /* =========================
         SHADOW SYSTEM (VERY IMPORTANT)
      ========================= */
      boxShadow: {
        glass: '0 10px 30px rgba(0,0,0,0.06)',
        depth: '0 20px 60px rgba(0,0,0,0.12)',
        glow: '0 6px 20px rgba(13,148,136,0.25)',
      },

      /* =========================
         BACKDROP BLUR (GLASS CONTROL)
      ========================= */
      backdropBlur: {
        xs: '2px',
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '24px',
      },

      /* =========================
         BORDER RADIUS (SOFTER UI)
      ========================= */
      borderRadius: {
        xl: '14px',
        '2xl': '20px',
        '3xl': '28px',
      },

      /* =========================
         ANIMATION SYSTEM
      ========================= */
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'float': 'float 7s ease-in-out infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },

        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },

        float: {
          '0%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
          '100%': { transform: 'translateY(0px)' },
        }
      },

      /* =========================
         SPACING (FOR CONSISTENCY)
      ========================= */
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        26: '6.5rem',
      }

    },
  },

  plugins: [],
};

