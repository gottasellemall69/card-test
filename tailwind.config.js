/** @type {import('tailwindcss').Config} */

module.exports = {
	darkMode: [ "class" ],
	content: [
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
	],

	theme: {
		extend: {
			colors: {
				grayscale: {
					'50': 'rgb(248, 248, 248)',
					'100': 'rgb(240, 240, 240)',
					'200': 'rgb(225, 225, 225)',
					'300': 'rgb(205, 205, 205)',
					'400': 'rgb(174, 174, 174)',
					'500': 'rgb(145, 145, 145)',
					'600': 'rgb(118, 118, 118)',
					'700': 'rgb(94, 94, 94)',
					'800': 'rgb(75, 75, 75)',
					'900': 'rgb(61, 61, 61)',
					'950': 'rgb(34, 34, 34)'
				},
				gray: {
					'50': 'rgb(247, 248, 247)',
					'100': 'rgb(239, 240, 239)',
					'200': 'rgb(224, 226, 223)',
					'300': 'rgb(202, 206, 201)',
					'400': 'rgb(169, 176, 168)',
					'500': 'rgb(138, 148, 137)',
					'600': 'rgb(111, 121, 110)',
					'700': 'rgb(88, 96, 87)',
					'800': 'rgb(70, 76, 69)',
					'900': 'rgb(58, 63, 57)',
					'950': 'rgb(32, 35, 32)'
				},
				red: {
					'50': 'rgb(253, 247, 247)',
					'100': 'rgb(250, 237, 237)',
					'200': 'rgb(246, 220, 220)',
					'300': 'rgb(239, 195, 194)',
					'400': 'rgb(229, 155, 154)',
					'500': 'rgb(218, 115, 113)',
					'600': 'rgb(207, 70, 68)',
					'700': 'rgb(174, 47, 45)',
					'800': 'rgb(139, 38, 36)',
					'900': 'rgb(115, 31, 30)',
					'950': 'rgb(66, 18, 17)'
				},
				brown: {
					'50': 'rgb(253, 249, 231)',
					'100': 'rgb(249, 241, 198)',
					'200': 'rgb(244, 226, 139)',
					'300': 'rgb(235, 204, 50)',
					'400': 'rgb(203, 173, 20)',
					'500': 'rgb(169, 144, 17)',
					'600': 'rgb(137, 117, 13)',
					'700': 'rgb(110, 93, 11)',
					'800': 'rgb(87, 74, 9)',
					'900': 'rgb(72, 61, 7)',
					'950': 'rgb(40, 34, 4)'
				},
				teal: {
					'50': 'rgb(240, 250, 249)',
					'100': 'rgb(223, 245, 242)',
					'200': 'rgb(188, 234, 229)',
					'300': 'rgb(140, 219, 210)',
					'400': 'rgb(61, 194, 178)',
					'500': 'rgb(50, 161, 148)',
					'600': 'rgb(41, 131, 120)',
					'700': 'rgb(33, 105, 97)',
					'800': 'rgb(26, 83, 76)',
					'900': 'rgb(22, 69, 63)',
					'950': 'rgb(12, 39, 36)'
				},
				yellow: {
					'50': 'rgb(255, 248, 230)',
					'100': 'rgb(255, 239, 199)',
					'200': 'rgb(255, 222, 139)',
					'300': 'rgb(255, 196, 47)',
					'400': 'rgb(227, 163, 0)',
					'500': 'rgb(189, 136, 0)',
					'600': 'rgb(154, 110, 0)',
					'700': 'rgb(123, 88, 0)',
					'800': 'rgb(98, 70, 0)',
					'900': 'rgb(81, 58, 0)',
					'950': 'rgb(46, 33, 0)'
				},
				green: {
					'50': 'rgb(248, 248, 246)',
					'100': 'rgb(240, 240, 235)',
					'200': 'rgb(226, 226, 216)',
					'300': 'rgb(206, 206, 190)',
					'400': 'rgb(176, 176, 150)',
					'500': 'rgb(147, 147, 111)',
					'600': 'rgb(120, 120, 90)',
					'700': 'rgb(96, 96, 72)',
					'800': 'rgb(76, 76, 57)',
					'900': 'rgb(62, 62, 47)',
					'950': 'rgb(35, 35, 26)'
				},
				blue: {
					'50': 'rgb(247, 248, 252)',
					'100': 'rgb(239, 240, 249)',
					'200': 'rgb(222, 224, 243)',
					'300': 'rgb(200, 203, 235)',
					'400': 'rgb(166, 171, 222)',
					'500': 'rgb(133, 140, 210)',
					'600': 'rgb(102, 110, 199)',
					'700': 'rgb(73, 83, 188)',
					'800': 'rgb(57, 65, 154)',
					'900': 'rgb(47, 53, 127)',
					'950': 'rgb(26, 30, 71)'
				},

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

			keyframes: {
				flip: {
					'0%': {
						transform: 'rotateY(0deg)'
					},
					'100%': {
						transform: 'rotateY(180deg)'
					}
				},
				'flip-back': {
					'0%': {
						transform: 'rotateY(180deg)'
					},
					'100%': {
						transform: 'rotateY(0deg)'
					}
				},
				gradient: {
					'0%, 100%': {
						'background-size': '200% 200%',
						'background-position': 'left center'
					},
					'50%': {
						'background-size': '200% 200%',
						'background-position': 'right center'
					}
				}
			},
			animation: {
				flip: 'flip 0.6s forwards',
				'flip-back': 'flip-back 0.6s forwards',
				gradient: 'gradient 15s ease infinite'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2%)',
				sm: 'calc(var(--radius) - 4%)'
			}
		}
	},
	plugins: [
		require( '@tailwindcss/forms' ),
		require( '@tailwindplus/elements' )
	],
};
