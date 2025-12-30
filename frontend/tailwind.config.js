import animate from 'tailwindcss-animate';

const midnight = {
  50: '#09060a',
  100: '#0b080d',
  200: '#110f14',
  300: '#15131a',
  400: '#1b1922',
  500: '#211f2b',
  600: '#282537',
  700: '#312e45',
  800: '#3b3854',
  900: '#464463',
  950: '#05040a',
};

const shadow = {
  50: '#f5efe7',
  100: '#e7dcca',
  200: '#d8c7ad',
  300: '#c5af8f',
  400: '#b29673',
  500: '#9b7b59',
  600: '#7f6143',
  700: '#664c33',
  800: '#4e3926',
  900: '#37271a',
};

const aurora = {
  50: '#fff7e5',
  100: '#fee7ba',
  200: '#fcd187',
  300: '#f8b551',
  400: '#f19b2d',
  500: '#d88216',
  600: '#b56911',
  700: '#8f500d',
  800: '#6d3b0a',
  900: '#4f2b07',
};

const nebula = {
  50: '#f3ecff',
  100: '#e5d6ff',
  200: '#cfadff',
  300: '#b683ff',
  400: '#9c5ef5',
  500: '#8042da',
  600: '#642fba',
  700: '#4a2392',
  800: '#34176a',
  900: '#211047',
};

const config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', './App.tsx'],
  safelist: [
    {
      pattern:
        /(bg|text|border|ring)-(midnight|shadow|aurora|nebula|obsidian|ash|ember)-(50|100|200|300|400|500|600|700|800|900)(\/(5|10|15|20|25|30|35|40|45|50|55|60|65|70|75|80|85|90))?/,
    },
    {
      pattern:
        /(from|via|to)-(midnight|shadow|aurora|nebula|obsidian|ash|ember)-(50|100|200|300|400|500|600|700|800|900)/,
    },
  ],
  theme: {
    extend: {
      colors: {
        midnight,
        shadow,
        aurora,
        nebula,
        obsidian: midnight,
        ash: shadow,
        ember: aurora,
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['Spectral', 'Georgia', 'serif'],
      },
      animation: {
        'aurora-wave': 'auroraWave 12s ease-in-out infinite alternate',
        'aurora-pulse': 'auroraPulse 8s ease-in-out infinite',
        'stars-twinkle': 'starsTwinkle 6s linear infinite',
        'veil-shift': 'veilShift 24s ease-in-out infinite alternate',
        'ember-pulse': 'emberPulse 14s ease-in-out infinite',
        'spark-drift': 'sparkDrift 18s linear infinite',
      },
      keyframes: {
        auroraWave: {
          '0%': {
            transform: 'translateX(-20%) skewX(-6deg)',
          },
          '50%': {
            transform: 'translateX(10%) skewX(4deg)',
          },
          '100%': {
            transform: 'translateX(30%) skewX(-2deg)',
          },
        },
        auroraPulse: {
          '0%, 100%': {
            opacity: '0.45',
            filter: 'blur(12px)',
          },
          '50%': {
            opacity: '0.7',
            filter: 'blur(16px)',
          },
        },
        starsTwinkle: {
          '0%, 100%': {
            opacity: '0.35',
          },
          '50%': {
            opacity: '0.8',
          },
        },
        veilShift: {
          '0%': {
            transform: 'translate3d(-4%, -2%, 0) scale(1.05)',
            opacity: '0.55',
          },
          '50%': {
            transform: 'translate3d(3%, 2%, 0) scale(1.08)',
            opacity: '0.75',
          },
          '100%': {
            transform: 'translate3d(6%, 4%, 0) scale(1.12)',
            opacity: '0.6',
          },
        },
        emberPulse: {
          '0%, 100%': {
            opacity: '0.15',
            filter: 'blur(18px)',
          },
          '40%': {
            opacity: '0.35',
            filter: 'blur(16px)',
          },
          '70%': {
            opacity: '0.25',
            filter: 'blur(22px)',
          },
        },
        sparkDrift: {
          '0%': {
            transform: 'translate3d(-10%, -12%, 0)',
          },
          '50%': {
            transform: 'translate3d(6%, 8%, 0)',
          },
          '100%': {
            transform: 'translate3d(14%, 16%, 0)',
          },
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [animate],
};

export default config;
