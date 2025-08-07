import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'brutalist': ['Oswald', 'Arial Black', 'Helvetica', 'sans-serif'],
				'industrial': ['Work Sans', 'Arial', 'Helvetica', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				
				/* Industrial palette */
				surface: 'hsl(var(--surface))',
				'surface-dark': 'hsl(var(--surface-dark))',
				concrete: 'hsl(var(--concrete))',
				steel: 'hsl(var(--steel))',
				charcoal: 'hsl(var(--charcoal))',
				void: 'hsl(var(--void))',
				'accent-pink': 'hsl(var(--accent-pink))',
				'accent-pink-subtle': 'hsl(var(--accent-pink-subtle))',
				'accent-pink-dark': 'hsl(var(--accent-pink-dark))',
				'accent-lime': 'hsl(var(--accent-lime))',
				'accent-lime-subtle': 'hsl(var(--accent-lime-subtle))',
				'accent-lime-dark': 'hsl(var(--accent-lime-dark))',
				'accent-orange': 'hsl(var(--accent-orange))',
				'accent-orange-subtle': 'hsl(var(--accent-orange-subtle))',
				'accent-orange-dark': 'hsl(var(--accent-orange-dark))',
				'accent-blood-red': 'hsl(var(--accent-blood-red))',
				'accent-blood-red-subtle': 'hsl(var(--accent-blood-red-subtle))',
				'accent-blood-red-dark': 'hsl(var(--accent-blood-red-dark))',
				'accent-vivid-purple': 'hsl(var(--accent-vivid-purple))',
				'accent-vivid-purple-subtle': 'hsl(var(--accent-vivid-purple-subtle))',
				'accent-vivid-purple-dark': 'hsl(var(--accent-vivid-purple-dark))',
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'pink-flash': {
					'0%': { transform: 'scale(0)', opacity: '0' },
					'50%': { transform: 'scale(1.2)', opacity: '1' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				'fade-out': {
					'0%': { opacity: '1' },
					'100%': { opacity: '0' }
				},
				'accent-pulse-text': {
					'0%': { color: 'hsl(var(--background))' },
					'10%': { color: 'hsl(var(--background))' },
					'30%': { color: 'var(--accent-color)' },
					'70%': { color: 'var(--accent-color)' },
					'90%': { color: 'hsl(var(--background))' },
					'100%': { color: 'hsl(var(--background))' }
				},
				'accent-pulse-button': {
					'0%': { 
						borderColor: 'hsla(255, 255, 255, 0.3)',
						backgroundColor: 'hsla(255, 255, 255, 0.1)'
					},
					'10%': { 
						borderColor: 'hsla(255, 255, 255, 0.3)',
						backgroundColor: 'hsla(255, 255, 255, 0.1)'
					},
					'30%': { 
						borderColor: 'var(--accent-color)',
						backgroundColor: 'var(--accent-color)'
					},
					'70%': { 
						borderColor: 'var(--accent-color)',
						backgroundColor: 'var(--accent-color)'
					},
					'90%': { 
						borderColor: 'hsla(255, 255, 255, 0.3)',
						backgroundColor: 'hsla(255, 255, 255, 0.1)'
					},
					'100%': { 
						borderColor: 'hsla(255, 255, 255, 0.3)',
						backgroundColor: 'hsla(255, 255, 255, 0.1)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'pink-flash': 'pink-flash 0.6s ease-out',
				'fade-out': 'fade-out 0.2s ease-out',
				'accent-pulse-text': 'accent-pulse-text 8s ease-in-out infinite',
				'accent-pulse-button': 'accent-pulse-button 8s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
