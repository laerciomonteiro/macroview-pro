import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Trading Terminal Dark Theme
        background: '#0b1326',
        surface: {
          DEFAULT: '#0b1326',
          dim: '#0b1326',
          container: '#171f33',
          'container-low': '#131b2e',
          'container-high': '#222a3d',
          'container-highest': '#2d3449',
          bright: '#31394d',
          lowest: '#060e20',
        },
        primary: {
          DEFAULT: '#4edea3',
          fixed: '#6ffbbe',
          'fixed-dim': '#4edea3',
          container: '#10b981',
          'on-container': '#00422b',
          'fixed-variant': '#005236',
        },
        secondary: {
          DEFAULT: '#ffb2b7',
          fixed: '#ffdadb',
          'fixed-dim': '#ffb2b7',
          container: '#b50036',
        },
        tertiary: {
          DEFAULT: '#f9bd22',
          fixed: '#ffdf9f',
          'fixed-dim': '#f9bd22',
          container: '#ce9a00',
        },
        on: {
          background: '#dae2fd',
          surface: '#dae2fd',
          'surface-variant': '#bbcabf',
          primary: '#003824',
          'primary-fixed': '#002113',
          'primary-fixed-variant': '#005236',
          secondary: '#67001b',
          'secondary-fixed': '#40000d',
          'secondary-fixed-variant': '#92002a',
          'secondary-container': '#ffc2c4',
          tertiary: '#402d00',
          'tertiary-fixed': '#261a00',
          'tertiary-fixed-variant': '#5c4300',
          'tertiary-container': '#4a3500',
          error: '#690005',
          'error-container': '#93000a',
        },
        error: {
          DEFAULT: '#ffb4ab',
          container: '#93000a',
        },
        outline: {
          DEFAULT: '#86948a',
          variant: '#3c4a42',
        },
        inverse: {
          surface: '#283044',
          'on-surface': '#283044',
          primary: '#006c49',
        },
      },
      fontFamily: {
        headline: ['Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        label: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.125rem',
        'lg': '0.25rem',
        'xl': '0.5rem',
        'full': '0.75rem',
      },
      animation: {
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
