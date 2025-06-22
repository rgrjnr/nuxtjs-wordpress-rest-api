import type { UsePostOptions, ModuleOptions } from '../../types'
import { computed, readonly, type Ref, type ComputedRef, watchEffect, watch, nextTick } from 'vue'
// @ts-ignore - Nuxt internal alias
import { useRoute, useAsyncData, useRuntimeConfig, useHead } from '#app'
import { useWpFetch } from './useWpFetch'
import { useWpSeo } from './useWpSeo'

export const usePost = (options: UsePostOptions = {}) => {
  const route = useRoute()
  const config = useRuntimeConfig()
  const wpConfig = (config.public.wordpress as ModuleOptions) || {}

  // Check if SEO integration is enabled
  const seoEnabled = computed(() => wpConfig.seoIntegration !== false)

  // Get slug from route params if not provided
  const slug = computed(() => {
    if (options.slug) return options.slug

    const routeSlug = route.params.slug
    return Array.isArray(routeSlug) ? routeSlug.join('/') : routeSlug
  })

  // Get post type from route or options
  const postType = computed(() => {
    if (options.type) return options.type

    // Try to extract from route name
    const routeName = route.name?.toString()
    if (routeName?.startsWith('wp-')) {
      return routeName.replace('wp-', '')
    }

    return 'posts'
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
    () => `wp:post:${postType.value}:${slug.value}:${JSON.stringify(options.query || {})}`
  )

  // Fetch the post using useAsyncData for SSR
  const { data, pending, error, refresh } = useAsyncData(
    key.value,
    async () => {
      console.log('Fetching post with key:', key.value)
      const result = await useWpFetch({
        endpoint: `/${postType.value}`,
        query: query.value,
        transform: (data: any[]) => {
          console.log('WordPress API response:', data)
          // WordPress returns an array even for single post queries by slug
          return data?.[0] || null
        }
      })
      console.log('Final post result:', result)
      return result
    },
    {
      server: true,
      default: () => null
    }
  )

  // Computed property for the post with proper typing
  const post = computed(() => data.value)

  // Set SEO meta tags when post data is available
  watchEffect(async () => {
    console.log('watchEffect triggered:', { 
      isPending: pending.value, 
      hasData: !!data.value, 
      seoEnabled: seoEnabled.value 
    })
    
    if (!pending.value && data.value && seoEnabled.value) {
      const currentPost = data.value
      console.log('Setting SEO meta for post (watchEffect):', currentPost.title?.rendered)

      try {
        // Use useWpSeo to set SEO meta tags
        const { setPostSeo } = useWpSeo()
        setPostSeo(currentPost)
        console.log('SEO set successfully via useWpSeo (watchEffect)')
      } catch (error) {
        console.error('Error setting SEO via useWpSeo (watchEffect):', error)
      }
    }
  })

  // Also watch the data property directly as a backup
  watch(data, async (newData) => {
    console.log('Data property changed:', { newData: !!newData, pending: pending.value, seoEnabled: seoEnabled.value })
    
    if (newData && !pending.value && seoEnabled.value) {
      const currentPost = newData
      console.log('Setting SEO meta for post (from data watch):', currentPost.title?.rendered)

      try {
        // Use useWpSeo to set SEO meta tags
        const { setPostSeo } = useWpSeo()
        setPostSeo(currentPost)
        console.log('SEO set successfully via useWpSeo (data watch)')
      } catch (error) {
        console.error('Error setting SEO via useWpSeo (data watch):', error)
      }
    }
  }, { immediate: true })

  // Set default SEO meta tags only if no data is available and we have an error
  if (seoEnabled.value && !data.value && error.value) {
    const defaultTitle = slug.value ? `${slug.value.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}` : 'Blog Post'
    const defaultDescription = 'Blog post from our website'
    
    console.log('Setting default SEO due to error:', defaultTitle)
    
    try {
      useHead({
        title: defaultTitle,
        meta: [
          { name: 'description', content: defaultDescription },
          { property: 'og:title', content: defaultTitle },
          { property: 'og:description', content: defaultDescription },
          { property: 'og:type', content: 'article' },
          { name: 'twitter:card', content: 'summary_large_image' },
          { name: 'twitter:title', content: defaultTitle },
          { name: 'twitter:description', content: defaultDescription }
        ]
      })
      console.log('Default SEO set successfully')
    } catch (error) {
      console.error('Error setting default SEO:', error)
    }
  }

  // Helper to check if post exists
  const exists = computed(() => !!post.value)

  // Helper to get post title
  const title = computed(() => post.value?.title?.rendered || '')

  // Helper to get post content (rendered by default)
  const content = computed(() => post.value?.content?.rendered || '')

  // Helper to get post excerpt
  const excerpt = computed(() => post.value?.excerpt?.rendered || '')

  // Helper to get post date
  const date = computed(() => post.value?.date || '')

  // Helper to get post modified date
  const modified = computed(() => post.value?.modified || '')

  // Helper to get post author
  const author = computed(() => post.value?._embedded?.author?.[0] || null)

  // Helper to get featured image
  const featuredImage = computed(() => post.value?._embedded?.['wp:featuredmedia']?.[0] || null)

  // Helper to get categories
  const categories = computed(
    () =>
      post.value?._embedded?.['wp:term']?.find((terms: any[]) =>
        terms.some((term) => term.taxonomy === 'category')
      ) || []
  )

  // Helper to get tags
  const tags = computed(
    () =>
      post.value?._embedded?.['wp:term']?.find((terms: any[]) =>
        terms.some((term) => term.taxonomy === 'post_tag')
      ) || []
  )

  // Helper to get Carbon Fields
  const carbon = computed(() => post.value?.carbon || {})

  // Helper to get post status
  const status = computed(() => post.value?.status || 'publish')

  // Helper to check if post is published
  const isPublished = computed(() => status.value === 'publish')

  // Helper to check if post has featured image
  const hasFeaturedImage = computed(() => !!featuredImage.value)

  // Helper to check if post has categories
  const hasCategories = computed(() => categories.value.length > 0)

  // Helper to check if post has tags
  const hasTags = computed(() => tags.value.length > 0)

  return {
    // Core data
    data,
    post,
    pending,
    error,
    refresh,

    // Content helpers
    title,
    content,
    excerpt,
    date,
    modified,

    // Relationship helpers
    author,
    featuredImage,
    categories,
    tags,

    // Meta helpers
    carbon,
    status,
    isPublished,
    hasFeaturedImage,
    hasCategories,
    hasTags,

    // Core helpers
    exists,

    // Meta
    slug: readonly(slug),
    postType: readonly(postType),
    seoEnabled: readonly(seoEnabled)
  }
}

// Type-safe version for specific post types
export const usePostTyped = <T = any>(options: UsePostOptions = {}) => {
  const result = usePost(options)

  return {
    ...result,
    post: result.post as ComputedRef<T | null>,
    data: result.data as Ref<T | null>
  }
}
