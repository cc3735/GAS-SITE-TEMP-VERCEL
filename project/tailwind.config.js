/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        page: 'rgb(var(--bg-page) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--bg-surface) / <alpha-value>)',
          hover: 'rgb(var(--bg-surface-hover) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'rgb(var(--text-primary) / <alpha-value>)',
          foreground: 'rgb(var(--bg-page) / <alpha-value>)', // usually inverse
        },
        secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
        subtle: 'rgb(var(--text-subtle) / <alpha-value>)',
        
        border: {
          DEFAULT: 'rgb(var(--border-default) / <alpha-value>)',
          strong: 'rgb(var(--border-strong) / <alpha-value>)',
        },
        
        accent: {
          DEFAULT: 'rgb(var(--accent-primary) / <alpha-value>)',
          hover: 'rgb(var(--accent-hover) / <alpha-value>)',
          foreground: 'rgb(var(--text-on-accent) / <alpha-value>)',
          subtle: 'rgb(var(--bg-accent-subtle) / <alpha-value>)',
          text: 'rgb(var(--text-accent) / <alpha-value>)',
        }
      },
    },
  },
  plugins: [],
};