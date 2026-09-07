/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f1f1fd',
          100: '#e3e4fb',
          200: '#c8caf7',
          300: '#a3a7f0',
          400: '#828fff',
          500: '#5e6ad2',
          600: '#4c56c0',
          700: '#3f47a3',
          800: '#343a85',
          900: '#2b3069',
        },
      },
    },
  },
  plugins: [],
};
