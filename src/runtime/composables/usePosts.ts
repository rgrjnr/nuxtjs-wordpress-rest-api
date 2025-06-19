import type { UsePostsOptions, ModuleOptions } from '../../types'
import { computed, ref, watch, readonly, type Ref, type ComputedRef } from 'vue'
import { useRuntimeConfig, useLazyAsyncData } from '#app'
import { useWpFetch } from './useWpFetch'

interface PostsData {
  posts: any[]
  pagination: {
    total: number
    totalPages: number
    currentPage: number
    perPage: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export const usePosts = (options: UsePostsOptions = {}) => {
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

  // Get post type
  const postType = computed(() => options.type || 'posts')

  // Generate cache key
  const key = computed(() => `wp:posts:${postType.value}:${JSON.stringify(query.value)}`)

  // Fetch the posts
  const { data, pending, error, refresh } = useLazyAsyncData<PostsData | null>(
    key.value,
    async () => {
      const response = await $fetch(`${wpConfig.wpBaseUrl}/wp-json/wp/v2/${postType.value}`, {
        query: query.value
      })
      // Extract pagination info from headers is not possible here, so fallback to default
      return {
        posts: Array.isArray(response) ? response : [],
        pagination: {
          total: 0,
          totalPages: 1,
          currentPage: query.value.page,
          perPage: query.value.per_page,
          hasNext: false,
          hasPrev: false
        }
      }
    },
    {
      server: true
    }
  )

  // Computed properties
  const posts = computed(() => data.value?.posts || [])
  const pagination = computed(
    () =>
      data.value?.pagination || {
        total: 0,
        totalPages: 1,
        currentPage: 1,
        perPage: 10,
        hasNext: false,
        hasPrev: false
      }
  )

  // Navigation helpers
  const nextPage = () => {
    if (pagination.value.hasNext) {
      return usePosts({
        ...options,
        page: pagination.value.currentPage + 1
      })
    }
    return null
  }

  const prevPage = () => {
    if (pagination.value.hasPrev) {
      return usePosts({
        ...options,
        page: pagination.value.currentPage - 1
      })
    }
    return null
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.value.totalPages) {
      return usePosts({
        ...options,
        page
      })
    }
    return null
  }

  // Helper to check if posts exist
  const exists = computed(() => posts.value.length > 0)

  // Helper to get posts with specific transformations
  const postsWithMeta = computed(() =>
    posts.value.map((post: any) => ({
      ...post,
      // Helper properties - content type selection is handled by WpContent component
      title: post.title?.rendered || '',
      content: post.content?.rendered || '',
      excerpt: post.excerpt?.rendered || '',
      featuredImage: post._embedded?.['wp:featuredmedia']?.[0] || null,
      author: post._embedded?.author?.[0] || null,
      categories:
        post._embedded?.['wp:term']?.find((terms: any[]) =>
          terms.some((term) => term.taxonomy === 'category')
        ) || [],
      tags:
        post._embedded?.['wp:term']?.find((terms: any[]) =>
          terms.some((term) => term.taxonomy === 'post_tag')
        ) || [],
      carbon: post.carbon || {}
    }))
  )

  return {
    // Core data
    data,
    posts,
    pending,
    error,
    refresh,

    // Pagination
    pagination,
    nextPage,
    prevPage,
    goToPage,

    // Helpers
    exists,
    postsWithMeta,

    // Meta
    postType: readonly(postType),
    query: readonly(query)
  }
}

// Helper for infinite scroll
export const usePostsInfinite = (options: UsePostsOptions = {}) => {
  const allPosts = ref<any[]>([])
  const currentPage = ref(1)
  const isLoadingMore = ref(false)

  const { data, pending, error, pagination } = usePosts({
    ...options,
    page: currentPage.value
  })

  // Watch for new data and append to allPosts
  watch(
    data,
    (newData) => {
      if (newData?.posts) {
        if (currentPage.value === 1) {
          allPosts.value = newData.posts
        } else {
          allPosts.value.push(...newData.posts)
        }
        isLoadingMore.value = false
      }
    },
    { immediate: true }
  )

  const loadMore = async () => {
    if (!pagination.value?.hasNext || isLoadingMore.value) return

    isLoadingMore.value = true
    currentPage.value++
  }

  const hasMore = computed(() => pagination.value?.hasNext || false)

  return {
    posts: readonly(allPosts),
    pending,
    error,
    pagination,
    loadMore,
    hasMore,
    isLoadingMore: readonly(isLoadingMore)
  }
}

// Type-safe version for specific post types
export const usePostsTyped = <T = any>(options: UsePostsOptions = {}) => {
  const result = usePosts(options)

  return {
    ...result,
    posts: result.posts as ComputedRef<T[]>,
    postsWithMeta: result.postsWithMeta as ComputedRef<T[]>,
    data: result.data as Ref<PostsData | null>
  }
}
