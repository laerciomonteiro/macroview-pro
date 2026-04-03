// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  
  ssr: true,
  
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],

  css: ['~/assets/css/main.css'],

  tailwindcss: {
    configPath: '~/tailwind.config.ts',
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  runtimeConfig: {
    // Server-only keys
    marketApiKey: process.env.MARKET_API_KEY || '',
    marketApiSecret: process.env.MARKET_API_SECRET || '',
    twelveDataApiKey: process.env.TWELVE_DATA_API_KEY || '',
    currentsApiKey: process.env.CURRENTS_API_KEY || '',
    guardianApiKey: process.env.GUARDIAN_API_KEY || '',
    
    // Public keys (exposed to frontend)
    public: {
      appName: 'MacroView Pro',
      refreshInterval: 60000, // 60 seconds
      geminiApiKey: process.env.GEMINI_API_KEY || '',
    },
  },

  app: {
    head: {
      title: 'MacroView Pro - Análise de Mercado',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Institutional Trading Dashboard' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { 
          rel: 'stylesheet', 
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap' 
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200'
        },
      ],
    },
  },

  compatibilityDate: '2024-04-03',
})
