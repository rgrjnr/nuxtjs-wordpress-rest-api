export default {
  modules: [
    '../src/module',
    '@nuxtjs/seo'
  ],
  runtimeConfig: {
    public: {
      wordpress: {
        wpBaseUrl: 'https://api.joseferreira.io',
        routePrefix: '/wp',
        enableAutoRouting: true,
        defaultContentType: 'raw',
        seoIntegration: true
      }
    }
  },
  components: {
    dirs: [
      '~/components'
    ],
    global: true
  },
  seo: {
    title: 'WordPress REST API Module Playground',
    description: 'Testing automatic block component discovery with WordPress REST API',
    url: 'https://example.com',
    siteName: 'WP REST API Module',
    ogImage: {
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'WordPress REST API Module'
    },
    twitterCard: 'summary_large_image',
    additionalMetaTags: [
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: '#667eea' }
    ]
  },
  devtools: { enabled: true }
}
