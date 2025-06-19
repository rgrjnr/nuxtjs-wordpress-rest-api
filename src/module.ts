import {
  defineNuxtModule,
  createResolver,
  addServerHandler,
  addImports,
  addComponent,
  addTypeTemplate,
  logger
} from '@nuxt/kit'
import { defu } from 'defu'
import { discoverWordPressTypes } from './runtime/utils/discovery'
import { generateVirtualRoutes } from './runtime/utils/routes'
import type { ModuleOptions, WpDiscoveryData } from './types'

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@nuxtjs/wordpress-rest-api',
    configKey: 'wordpress',
    compatibility: {
      nuxt: '^3.0.0'
    }
  },
  defaults: {
    wpBaseUrl: '',
    wpQueryDefaults: {
      _embed: true
    },
    defaultContentType: 'rendered',
    errorStrategy: 'throw',
    routePrefix: '/wp',
    enableAutoRouting: false,
    enableTyping: true,
    seoIntegration: true,
    blockComponents: {
      enableAutoDiscovery: true,
      componentPaths: ['components/wp', 'components/blocks', 'components'],
      namingConventions: ['pascal', 'camel', 'kebab'],
      fallbackComponent: 'WpBlock'
    }
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Validate required config
    if (!options.wpBaseUrl && !nuxt.options.runtimeConfig.public.wpBaseUrl) {
      logger.warn(
        'WordPress base URL not configured. Set wpBaseUrl in module options or runtimeConfig.public.wpBaseUrl'
      )
    }

    // Setup runtime config
    nuxt.options.runtimeConfig.public.wordpress = defu(
      nuxt.options.runtimeConfig.public.wordpress || {},
      {
        wpBaseUrl: options.wpBaseUrl,
        wpQueryDefaults: options.wpQueryDefaults,
        defaultContentType: options.defaultContentType,
        errorStrategy: options.errorStrategy,
        routePrefix: options.routePrefix,
        enableAutoRouting: options.enableAutoRouting,
        seoIntegration: options.seoIntegration
      }
    )

    // Discovery phase - fetch WP types and taxonomies
    let discoveredData: WpDiscoveryData | null = null
    const wpBaseUrl = options.wpBaseUrl || nuxt.options.runtimeConfig.public.wpBaseUrl

    if (wpBaseUrl && typeof wpBaseUrl === 'string' && options.enableTyping) {
      try {
        discoveredData = await discoverWordPressTypes(wpBaseUrl, nuxt)

        // Augment runtime config with discovered data
        if (discoveredData) {
          nuxt.options.runtimeConfig.public.wp = defu(nuxt.options.runtimeConfig.public.wp || {}, {
            postTypes: discoveredData.postTypes || [],
            taxonomies: discoveredData.taxonomies || []
          })
        }
      } catch (error) {
        logger.warn('Failed to discover WordPress types:', error)
      }
    }

    // Generate TypeScript types if discovery succeeded
    if (discoveredData && options.enableTyping) {
      addTypeTemplate({
        filename: 'types/wp.d.ts',
        getContents: () => generateTypeDefinitions(discoveredData)
      })
    }

    // Add runtime directory
    nuxt.options.build = nuxt.options.build || {}
    nuxt.options.build.transpile = nuxt.options.build.transpile || []
    nuxt.options.build.transpile.push(resolver.resolve('runtime'))

    // Add plugin
    addServerHandler({
      route: '/api/_wp/**',
      handler: resolver.resolve('runtime/server/api/wp.get')
    })

    // Auto-import composables
    addImports([
      { name: 'usePost', from: resolver.resolve('runtime/composables/usePost') },
      { name: 'usePosts', from: resolver.resolve('runtime/composables/usePosts') },
      { name: 'useTerm', from: resolver.resolve('runtime/composables/useTerm') },
      { name: 'useTerms', from: resolver.resolve('runtime/composables/useTerms') },
      { name: 'useWpFetch', from: resolver.resolve('runtime/composables/useWpFetch') },
      { name: 'useBlockComponents', from: resolver.resolve('runtime/composables/useBlockComponents') },
      { name: 'useWpSeo', from: resolver.resolve('runtime/composables/useWpSeo') }
    ])

    // Auto-import components
    addComponent({
      name: 'WpContent',
      filePath: resolver.resolve('runtime/components/WpContent.vue')
    })

    addComponent({
      name: 'WpBlock',
      filePath: resolver.resolve('runtime/components/WpBlock.vue')
    })

    // Generate virtual routes for WordPress content
    if (options.enableAutoRouting && discoveredData && options.routePrefix) {
      generateVirtualRoutes(nuxt, discoveredData, options.routePrefix)
    }

    // Add plugin for data injection
    nuxt.options.plugins = nuxt.options.plugins || []
    nuxt.options.plugins.push({
      src: resolver.resolve('runtime/plugins/wordpress.client'),
      mode: 'client'
    })

    nuxt.options.plugins.push({
      src: resolver.resolve('runtime/plugins/wordpress.server'),
      mode: 'server'
    })
  }
})

function generateTypeDefinitions(discoveredData: WpDiscoveryData): string {
  let types = `// Auto-generated WordPress types
declare global {
  interface WpBase {
    id: number
    date: string
    date_gmt: string
    guid: {
      rendered: string
    }
    modified: string
    modified_gmt: string
    slug: string
    status: string
    type: string
    link: string
    title: {
      rendered: string
    }
    content: {
      rendered: string
      protected: boolean
    }
    excerpt: {
      rendered: string
      protected: boolean
    }
    author: number
    featured_media: number
    comment_status: string
    ping_status: string
    sticky: boolean
    template: string
    format: string
    meta: Record<string, unknown>
    categories: number[]
    tags: number[]
    carbon?: Record<string, unknown>
    _embedded?: {
      author?: unknown[]
      'wp:featuredmedia'?: unknown[]
      'wp:term'?: unknown[][]
    }
  }

  interface WpTerm {
    id: number
    count: number
    description: string
    link: string
    name: string
    slug: string
    taxonomy: string
    parent: number
    meta: Record<string, unknown>
    carbon?: Record<string, unknown>
  }

`

  // Generate specific post type interfaces
  if (discoveredData.postTypes) {
    for (const postType of discoveredData.postTypes) {
      const typeName = postType.charAt(0).toUpperCase() + postType.slice(1)
      types += `  interface Wp${typeName} extends WpBase {
    type: '${postType}'
  }

`
    }
  }

  // Generate taxonomy interfaces
  if (discoveredData.taxonomies) {
    for (const taxonomy of discoveredData.taxonomies) {
      const typeName = taxonomy.charAt(0).toUpperCase() + taxonomy.slice(1)
      types += `  interface Wp${typeName}Term extends WpTerm {
    taxonomy: '${taxonomy}'
  }

`
    }
  }

  types += `}

export {}`

  return types
}
