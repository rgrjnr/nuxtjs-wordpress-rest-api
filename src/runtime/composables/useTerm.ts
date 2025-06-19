import type { UseTermOptions, ModuleOptions } from '../../types'
import { computed, ref, watch, readonly, type Ref, type ComputedRef } from 'vue'
import { useRoute, useLazyAsyncData, useRuntimeConfig } from '#app'
import { useWpFetch } from './useWpFetch'

export const useTerm = (options: UseTermOptions = {}) => {
  const route = useRoute()
  const config = useRuntimeConfig()
  const wpConfig = (config.public.wordpress as ModuleOptions) || {}

  // Get slug from route params if not provided
  const slug = computed(() => {
    if (options.slug) return options.slug

    const routeSlug = route.params.slug
    return Array.isArray(routeSlug) ? routeSlug.join('/') : routeSlug
  })

  // Get taxonomy from route or options
  const taxonomy = computed(() => {
    if (options.taxonomy) return options.taxonomy

    // Try to extract from route name
    const routeName = route.name?.toString()
    if (routeName?.startsWith('wp-')) {
      return routeName.replace('wp-', '')
    }

    return 'categories'
  })

  // Build query parameters
  const query = computed(() => {
    return {
      slug: slug.value,
      ...options.query
    }
  })

  // Generate cache key
  const key = computed(
    () => `wp:term:${taxonomy.value}:${slug.value}:${JSON.stringify(options.query || {})}`
  )

  // Fetch the term
  const { data, pending, error, refresh } = useLazyAsyncData(
    key.value,
    () =>
      useWpFetch({
        endpoint: `/${taxonomy.value}`,
        query: query.value,
        transform: (data: any[]) => {
          // WordPress returns an array even for single term queries by slug
          return data?.[0] || null
        }
      }),
    {
      server: true
    }
  )

  // Computed property for the term with proper typing
  const term = computed(() => data.value)

  // Helper to check if term exists
  const exists = computed(() => !!term.value)

  // Helper to get term name
  const name = computed(() => term.value?.name || '')

  // Helper to get term description
  const description = computed(() => term.value?.description || '')

  // Helper to get term count
  const count = computed(() => term.value?.count || 0)

  // Helper to get term link
  const link = computed(() => term.value?.link || '')

  // Helper to get parent term
  const parent = computed(() => term.value?.parent || 0)

  // Helper to get Carbon Fields
  const carbon = computed(() => term.value?.carbon || {})

  // Helper to check if term has parent
  const hasParent = computed(() => parent.value > 0)

  // Helper to check if term has posts
  const hasPosts = computed(() => count.value > 0)

  return {
    // Core data
    data,
    term,
    pending,
    error,
    refresh,

    // Helpers
    exists,
    name,
    description,
    count,
    link,
    parent,
    carbon,
    hasParent,
    hasPosts,

    // Meta
    slug: readonly(slug),
    taxonomy: readonly(taxonomy)
  }
}

// Get term with its parent hierarchy
export const useTermWithHierarchy = (options: UseTermOptions = {}) => {
  const termResult = useTerm(options)
  const parents = ref<any[]>([])

  // Fetch parent terms if needed
  const fetchParents = async () => {
    if (!termResult.term.value?.parent) return

    const parentTerms = []
    let currentParent = termResult.term.value.parent

    while (currentParent > 0) {
      try {
        const parent = await useWpFetch({
          endpoint: `/${termResult.taxonomy.value}/${currentParent}`
        })

        if (parent) {
          parentTerms.unshift(parent)
          currentParent = parent.parent
        } else {
          break
        }
      } catch {
        break
      }
    }

    parents.value = parentTerms
  }

  // Watch for term changes and fetch parents
  watch(
    () => termResult.term.value,
    (newTerm) => {
      if (newTerm?.parent) {
        fetchParents()
      } else {
        parents.value = []
      }
    },
    { immediate: true }
  )

  // Get full hierarchy path
  const hierarchy = computed(() => [...parents.value, termResult.term.value].filter(Boolean))

  // Get breadcrumb path
  const breadcrumbs = computed(() =>
    hierarchy.value.map((term) => ({
      name: term.name,
      slug: term.slug,
      link: term.link
    }))
  )

  return {
    ...termResult,
    parents: readonly(parents),
    hierarchy: readonly(hierarchy),
    breadcrumbs: readonly(breadcrumbs)
  }
}

// Type-safe version for specific taxonomies
export const useTermTyped = <T = any>(options: UseTermOptions = {}) => {
  const result = useTerm(options)

  return {
    ...result,
    term: result.term as ComputedRef<T | null>,
    data: result.data as Ref<T | null>
  }
}
