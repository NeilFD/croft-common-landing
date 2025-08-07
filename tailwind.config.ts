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
					'5%': { color: 'hsl(var(--background))' },
					'15%': { color: 'color-mix(in hsl, hsl(var(--background)) 80%, var(--accent-color) 20%)' },
					'25%': { color: 'color-mix(in hsl, hsl(var(--background)) 60%, var(--accent-color) 40%)' },
					'35%': { color: 'color-mix(in hsl, hsl(var(--background)) 40%, var(--accent-color) 60%)' },
					'45%': { color: 'color-mix(in hsl, hsl(var(--background)) 20%, var(--accent-color) 80%)' },
					'50%': { color: 'var(--accent-color)' },
					'55%': { color: 'color-mix(in hsl, hsl(var(--background)) 20%, var(--accent-color) 80%)' },
					'65%': { color: 'color-mix(in hsl, hsl(var(--background)) 40%, var(--accent-color) 60%)' },
					'75%': { color: 'color-mix(in hsl, hsl(var(--background)) 60%, var(--accent-color) 40%)' },
					'85%': { color: 'color-mix(in hsl, hsl(var(--background)) 80%, var(--accent-color) 20%)' },
					'95%': { color: 'hsl(var(--background))' },
					'100%': { color: 'hsl(var(--background))' }
				},
				'accent-pulse-button': {
					'0%': { 
						borderColor: 'hsl(255, 255, 255, 0.3)',
						backgroundColor: 'hsl(255, 255, 255, 0.1)'
					},
					'5%': { 
						borderColor: 'hsl(255, 255, 255, 0.3)',
						backgroundColor: 'hsl(255, 255, 255, 0.1)'
					},
					'15%': { 
						borderColor: 'color-mix(in hsl, hsl(255, 255, 255, 0.3) 80%, var(--accent-color) 20%)',
						backgroundColor: 'color-mix(in hsl, hsl(255, 255, 255, 0.1) 80%, var(--accent-color) 20%)'
					},
					'25%': { 
						borderColor: 'color-mix(in hsl, hsl(255, 255, 255, 0.3) 60%, var(--accent-color) 40%)',
						backgroundColor: 'color-mix(in hsl, hsl(255, 255, 255, 0.1) 60%, var(--accent-color) 40%)'
					},
					'35%': { 
						borderColor: 'color-mix(in hsl, hsl(255, 255, 255, 0.3) 40%, var(--accent-color) 60%)',
						backgroundColor: 'color-mix(in hsl, hsl(255, 255, 255, 0.1) 40%, var(--accent-color) 60%)'
					},
					'45%': { 
						borderColor: 'color-mix(in hsl, hsl(255, 255, 255, 0.3) 20%, var(--accent-color) 80%)',
						backgroundColor: 'color-mix(in hsl, hsl(255, 255, 255, 0.1) 20%, var(--accent-color) 80%)'
					},
					'50%': { 
						borderColor: 'var(--accent-color)',
						backgroundColor: 'var(--accent-color)'
					},
					'55%': { 
						borderColor: 'color-mix(in hsl, hsl(255, 255, 255, 0.3) 20%, var(--accent-color) 80%)',
						backgroundColor: 'color-mix(in hsl, hsl(255, 255, 255, 0.1) 20%, var(--accent-color) 80%)'
					},
					'65%': { 
						borderColor: 'color-mix(in hsl, hsl(255, 255, 255, 0.3) 40%, var(--accent-color) 60%)',
						backgroundColor: 'color-mix(in hsl, hsl(255, 255, 255, 0.1) 40%, var(--accent-color) 60%)'
					},
					'75%': { 
						borderColor: 'color-mix(in hsl, hsl(255, 255, 255, 0.3) 60%, var(--accent-color) 40%)',
						backgroundColor: 'color-mix(in hsl, hsl(255, 255, 255, 0.1) 60%, var(--accent-color) 40%)'
					},
					'85%': { 
						borderColor: 'color-mix(in hsl, hsl(255, 255, 255, 0.3) 80%, var(--accent-color) 20%)',
						backgroundColor: 'color-mix(in hsl, hsl(255, 255, 255, 0.1) 80%, var(--accent-color) 20%)'
					},
					'95%': { 
						borderColor: 'hsl(255, 255, 255, 0.3)',
						backgroundColor: 'hsl(255, 255, 255, 0.1)'
					},
					'100%': { 
						borderColor: 'hsl(255, 255, 255, 0.3)',
						backgroundColor: 'hsl(255, 255, 255, 0.1)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'pink-flash': 'pink-flash 0.6s ease-out',
				'fade-out': 'fade-out 0.2s ease-out',
				'accent-pulse-text': 'accent-pulse-text 12s linear infinite',
				'accent-pulse-button': 'accent-pulse-button 12s linear infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
