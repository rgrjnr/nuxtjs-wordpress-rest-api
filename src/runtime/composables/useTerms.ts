import type { UseTermsOptions, ModuleOptions } from '../../types'
import { computed, readonly, type Ref, type ComputedRef } from 'vue'
import { useLazyAsyncData, useRuntimeConfig } from '#app'
import { useWpFetch } from './useWpFetch'

export const useTerms = (options: UseTermsOptions = {}) => {
  const config = useRuntimeConfig()
  const wpConfig = (config.public.wordpress as ModuleOptions) || {}

  // Build query parameters
  const query = computed(() => {
    return {
      per_page: options.per_page || 10,
      page: options.page || 1,
      ...options.query
    }
  })

  // Get taxonomy
  const taxonomy = computed(() => options.taxonomy || 'categories')

  // Generate cache key
  const key = computed(() => `wp:terms:${taxonomy.value}:${JSON.stringify(query.value)}`)

  // Fetch the terms
  const { data, pending, error, refresh } = useLazyAsyncData(
    key.value,
    () =>
      useWpFetch({
        endpoint: `/${taxonomy.value}`,
        query: query.value
      }),
    {
      server: true
    }
  )

  // Computed properties
  const terms = computed(() => (Array.isArray(data.value) ? data.value : []))

  // Helper to check if terms exist
  const exists = computed(() => terms.value.length > 0)

  // Helper to get terms with additional properties
  const termsWithMeta = computed(() =>
    terms.value.map((term: any) => ({
      ...term,
      // Helper properties
      carbon: term.carbon || {},
      hasParent: term.parent > 0,
      hasPosts: term.count > 0
    }))
  )

  // Helper to get parent terms
  const parentTerms = computed(() => terms.value.filter((term: any) => term.parent === 0))

  // Helper to get child terms
  const childTerms = computed(() => terms.value.filter((term: any) => term.parent > 0))

  // Helper to build term hierarchy
  const hierarchy = computed(() => {
    const termMap = new Map(terms.value.map((term: any) => [term.id, { ...term, children: [] }]))
    const rootTerms: any[] = []

    for (const term of termMap.values()) {
      if ((term as any).parent === 0) {
        rootTerms.push(term)
      } else {
        const parent = termMap.get((term as any).parent)
        if (parent) {
          ;(parent as any).children.push(term)
        }
      }
    }

    return rootTerms
  })

  return {
    // Core data
    data,
    terms,
    pending,
    error,
    refresh,

    // Helpers
    exists,
    termsWithMeta,
    parentTerms,
    childTerms,
    hierarchy,

    // Meta
    taxonomy: readonly(taxonomy),
    query: readonly(query)
  }
}

// Type-safe version for specific taxonomies
export const useTermsTyped = <T = unknown>(options: UseTermsOptions = {}) => {
  const result = useTerms(options)

  return {
    ...result,
    terms: result.terms as ComputedRef<T[]>,
    data: result.data as Ref<T[] | null>
  }
}
