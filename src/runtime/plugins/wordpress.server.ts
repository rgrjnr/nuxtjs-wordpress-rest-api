import { defineNuxtPlugin, useRuntimeConfig, useRoute } from '#app'
import { useWpFetch } from '../composables/useWpFetch'
import type { ModuleOptions } from '../../types'

export default defineNuxtPlugin((nuxtApp: any) => {
  const config = useRuntimeConfig()
  const wpConfig = (config.public.wordpress as Partial<ModuleOptions>) || {}
  const route = useRoute()

  // Type-guarded usage of routePrefix
  const routePrefix =
    typeof wpConfig.routePrefix === 'string' ? wpConfig.routePrefix.replace(/^\//, '') : 'wp'

  // Type-guarded usage of postTypes
  const hasPostType = (typeOrTaxonomy: string) =>
    Array.isArray(wpConfig.postTypes) && wpConfig.postTypes.includes(typeOrTaxonomy)

  // Type-guarded usage of taxonomies
  const hasTaxonomy = (typeOrTaxonomy: string) =>
    Array.isArray(wpConfig.taxonomies) && wpConfig.taxonomies.includes(typeOrTaxonomy)

  // Example: Provide post and term composables globally
  nuxtApp.provide('post', null)
  nuxtApp.provide('term', null)

  // You can add more logic here as needed
})
