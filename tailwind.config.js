/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
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
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'gradient-x': {
  				'0%, 100%': {
  					'background-size': '200% 200%',
  					'background-position': 'left center'
  				},
  				'50%': {
  					'background-size': '200% 200%',
  					'background-position': 'right center'
  				}
  			},
                        'shimmer': {
                          '0%': { transform: 'translateX(-100%)' },
                          '100%': { transform: 'translateX(100%)' }
                        }
  		},
  		animation: {
  			'gradient-x': 'gradient-x 3s ease infinite',
                        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        'shimmer': 'shimmer 2s infinite'
  		},
		fontFamily: {
			roboto: ['Roboto', 'sans-serif'],
			helvetica: ['Helvetica', 'sans-serif'],
			segoe: ['segoe ui', 'sans-serif'],
			arial: ['Arial', 'sans-serif'],
			verdana: ['Verdana', 'sans-serif'],
			tahoma: ['Tahoma', 'sans-serif'],
			times: ['Times New Roman', 'serif'],
			georgia: ['Georgia', 'serif'],
			garamond: ['Garamond', 'serif'],
			nunito: ['Nunito', 'sans-serif'],
			poppins: ['Poppins', 'sans-serif'],
			quicksand: ['Quicksand', 'sans-serif'],
		},
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
