/** @type {import('tailwindcss').Config} */

const midnight = {
  50: '#050607',
  100: '#07090b',
  200: '#0c1014',
  300: '#13181f',
  400: '#192029',
  500: '#1f2833',
  600: '#26313e',
  700: '#2d3a4a',
  800: '#344355',
  900: '#3b4c60',
};

const shadow = {
  50: '#f2f3f3',
  100: '#dadbde',
  200: '#b9bcc5',
  300: '#989da9',
  400: '#7a8090',
  500: '#616674',
  600: '#4b525f',
  700: '#39404c',
  800: '#2b303b',
  900: '#1f2430',
};

const aurora = {
  50: '#fff7e8',
  100: '#fde8be',
  200: '#f9d591',
  300: '#f3c061',
  400: '#e9aa3a',
  500: '#d38f1f',
  600: '#b87414',
  700: '#985a12',
  800: '#784512',
  900: '#5d360f',
};

const nebula = {
  50: '#f2ecff',
  100: '#e1d6ff',
  200: '#c6b2ff',
  300: '#a88cf6',
  400: '#8c6de4',
  500: '#7256cb',
  600: '#5a42a9',
  700: '#453383',
  800: '#31245d',
  900: '#21173f',
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
  		fontFamily: {
  			display: ['Cinzel', 'serif'],
  			body: ['Spectral', 'Georgia', 'serif']
  		},
  		animation: {
  			'aurora-wave': 'auroraWave 12s ease-in-out infinite alternate',
  			'aurora-pulse': 'auroraPulse 8s ease-in-out infinite',
  			'stars-twinkle': 'starsTwinkle 6s linear infinite',
  			'veil-shift': 'veilShift 24s ease-in-out infinite alternate',
  			'ember-pulse': 'emberPulse 14s ease-in-out infinite',
  			'spark-drift': 'sparkDrift 18s linear infinite'
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
  			},
  			veilShift: {
  				'0%': {
  					transform: 'translate3d(-4%, -2%, 0) scale(1.05)',
  					opacity: '0.55'
  				},
  				'50%': {
  					transform: 'translate3d(3%, 2%, 0) scale(1.08)',
  					opacity: '0.75'
  				},
  				'100%': {
  					transform: 'translate3d(6%, 4%, 0) scale(1.12)',
  					opacity: '0.6'
  				}
  			},
  			emberPulse: {
  				'0%, 100%': {
  					opacity: '0.15',
  					filter: 'blur(18px)'
  				},
  				'40%': {
  					opacity: '0.35',
  					filter: 'blur(16px)'
  				},
  				'70%': {
  					opacity: '0.25',
  					filter: 'blur(22px)'
  				}
  			},
  			sparkDrift: {
  				'0%': {
  					transform: 'translate3d(-10%, -12%, 0)'
  				},
  				'50%': {
  					transform: 'translate3d(6%, 8%, 0)'
  				},
  				'100%': {
  					transform: 'translate3d(14%, 16%, 0)'
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

