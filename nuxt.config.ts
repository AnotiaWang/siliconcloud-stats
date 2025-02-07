import AutoImport from 'unplugin-auto-import/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/robots',
    '@nuxtjs/sitemap',
    '@nuxt/eslint',
    '@nuxt/ui',
    'nuxt-echarts',
  ],

  plugins: [],


  css: ['~/assets/css/main.css'],

  colorMode: {
    preference: 'system',
    dataValue: 'theme',
    classSuffix: '',
    storage: 'cookie',
  },

  // Sitemap module configuration: https://nuxtseo.com/site-config/getting-started/how-it-works
  site: {
    url: 'https://siliconcloud-stats.ataw.top',
    name: 'SiliconCloud Stats',
    description: 'SiliconCloud 平台使用情况分析工具，提供 token 用量分析等功能',
    defaultLocale: 'zh-CN',
  },

  robots: {
    // 配置 robots.txt
    allow: '/',
    sitemap: 'https://siliconcloud-stats.ataw.top/sitemap.xml', // 请替换为实际的网站 URL
  },

  sitemap: {
    // 配置 sitemap
    exclude: ['/api/**'],
    defaults: {
      changefreq: 'daily',
      priority: 0.8,
      lastmod: new Date().toISOString(),
    },
  },

  nitro: {
    compressPublicAssets: { brotli: true, gzip: true },
  },

  vite: {
    vue: {
      script: {
        defineModel: true,
        propsDestructure: true,
      },
    },
    plugins: [
      AutoImport({
        imports: ['pinia'],
        dts: 'types/auto-imports.d.ts',
        dirs: ['hooks/**', 'stores', 'constants', 'utils/**', 'layouts'],
        vueTemplate: true,
        resolvers: [],
      }),
    ],
  },

  future: {
    // 启用 Nuxt 4 功能前瞻
    compatibilityVersion: 4,
  },

  compatibilityDate: '2024-07-19',
})
