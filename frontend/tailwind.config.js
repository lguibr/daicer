/** @type {import('tailwindcss').Config} */

const midnight = {
  50: '#090909',
  100: '#0c0c0c',
  200: '#121212',
  300: '#161616',
  400: '#1b1b1b',
  500: '#202020',
  600: '#262626',
  700: '#2c2c2c',
  800: '#323232',
  900: '#3a3a3a',
};

const shadow = {
  50: '#f7f7f7',
  100: '#e6e6e6',
  200: '#d1d1d1',
  300: '#b0b0b0',
  400: '#8d8d8d',
  500: '#6e6e6e',
  600: '#535353',
  700: '#3d3d3d',
  800: '#2a2a2a',
  900: '#181818',
};

const aurora = {
  50: '#fff5e8',
  100: '#ffe4c2',
  200: '#ffcb8f',
  300: '#ffb05b',
  400: '#ff9733',
  500: '#f48117',
  600: '#d36a10',
  700: '#af540d',
  800: '#8b420f',
  900: '#703410',
};

const nebula = {
  50: '#f7ecff',
  100: '#ead4ff',
  200: '#d1a9ff',
  300: '#b980f6',
  400: '#a064e4',
  500: '#864bd0',
  600: '#6c36af',
  700: '#552a8b',
  800: '#3d1f66',
  900: '#291547',
};

const config = {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
  ],
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
  			obsidian: 'midnight',
  			ash: 'shadow',
  			ember: 'aurora',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		animation: {
  			'aurora-wave': 'auroraWave 12s ease-in-out infinite alternate',
  			'aurora-pulse': 'auroraPulse 8s ease-in-out infinite',
  			'stars-twinkle': 'starsTwinkle 6s linear infinite'
  		},
  		keyframes: {
  			auroraWave: {
  				'0%': {
  					transform: 'translateX(-20%) skewX(-6deg)'
  				},
  				'50%': {
  					transform: 'translateX(10%) skewX(4deg)'
  				},
  				'100%': {
  					transform: 'translateX(30%) skewX(-2deg)'
  				}
  			},
  			auroraPulse: {
  				'0%, 100%': {
  					opacity: '0.45',
  					filter: 'blur(12px)'
  				},
  				'50%': {
  					opacity: '0.7',
  					filter: 'blur(16px)'
  				}
  			},
  			starsTwinkle: {
  				'0%, 100%': {
  					opacity: '0.35'
  				},
  				'50%': {
  					opacity: '0.8'
  				}
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;

