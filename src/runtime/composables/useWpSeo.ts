// @ts-ignore - Nuxt internal alias
import { useHead, useSeoMeta } from '#app'

export interface WpSeoOptions {
  /**
   * Whether to enable automatic SEO from WordPress post data
   */
  enabled?: boolean
  
  /**
   * Custom title template
   */
  titleTemplate?: string
  
  /**
   * Custom description template
   */
  descriptionTemplate?: string
  
  /**
   * Fallback image URL for Open Graph
   */
  fallbackImage?: string
  
  /**
   * Whether to include author information
   */
  includeAuthor?: boolean
  
  /**
   * Whether to include publication date
   */
  includeDate?: boolean
  
  /**
   * Whether to use useSeoMeta instead of useHead
   */
  useSeoMeta?: boolean
}

export function useWpSeo(options: WpSeoOptions = {}) {
  const {
    enabled = true,
    titleTemplate = '%s',
    descriptionTemplate = '%s',
    fallbackImage = '/og-image.jpg',
    includeAuthor = true,
    includeDate = true,
    useSeoMeta: useSeoMetaOption = false
  } = options

  /**
   * Set SEO meta tags from WordPress post data
   */
  const setPostSeo = (post: any) => {
    if (!enabled || !post) {
      console.log('SEO disabled or no post data:', { enabled, hasPost: !!post })
      return
    }

    console.log('Setting SEO for post:', post.title?.rendered)

    // Extract post data
    const title = post.title?.rendered || 'Untitled'
    const description = post.excerpt?.rendered || ''
    const url = post.link || post.guid?.rendered || ''
    const date = post.date || post.modified || ''
    const author = post._embedded?.author?.[0] || null
    const featuredImage = post._embedded?.['wp:featuredmedia']?.[0] || null

    // Clean HTML from description
    const cleanDescription = description
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 160) // Limit to 160 characters

    // Build author string
    const authorString = author ? `${author.name}` : ''

    if (useSeoMetaOption) {
      // Use useSeoMeta for better TypeScript support
      useSeoMeta({
        title: titleTemplate.replace('%s', title),
        description: descriptionTemplate.replace('%s', cleanDescription),
        ogTitle: titleTemplate.replace('%s', title),
        ogDescription: descriptionTemplate.replace('%s', cleanDescription),
        ogUrl: url,
        ogType: 'article',
        ogImage: featuredImage?.source_url || fallbackImage,
        twitterCard: 'summary_large_image',
        twitterTitle: titleTemplate.replace('%s', title),
        twitterDescription: descriptionTemplate.replace('%s', cleanDescription),
        twitterImage: featuredImage?.source_url || fallbackImage,
        articleAuthor: includeAuthor ? authorString : undefined,
        articlePublishedTime: includeDate ? date : undefined,
        articleModifiedTime: post.modified || undefined,
        articleSection: post.categories?.length ? 'Blog' : undefined,
        articleTag: post.tags?.map((tag: any) => tag.name).join(', ') || undefined,
      })
    } else {
      // Use useHead for better SSR compatibility
      useHead({
        title: titleTemplate.replace('%s', title),
        meta: [
          { name: 'description', content: descriptionTemplate.replace('%s', cleanDescription) },
          { property: 'og:title', content: titleTemplate.replace('%s', title) },
          { property: 'og:description', content: descriptionTemplate.replace('%s', cleanDescription) },
          { property: 'og:url', content: url },
          { property: 'og:type', content: 'article' },
          { property: 'og:image', content: featuredImage?.source_url || fallbackImage },
          { name: 'twitter:card', content: 'summary_large_image' },
          { name: 'twitter:title', content: titleTemplate.replace('%s', title) },
          { name: 'twitter:description', content: descriptionTemplate.replace('%s', cleanDescription) },
          { name: 'twitter:image', content: featuredImage?.source_url || fallbackImage },
          ...(includeAuthor && authorString ? [{ property: 'article:author', content: authorString }] : []),
          ...(includeDate && date ? [{ property: 'article:published_time', content: date }] : []),
          ...(post.modified ? [{ property: 'article:modified_time', content: post.modified }] : []),
          ...(post.categories?.length ? [{ property: 'article:section', content: 'Blog' }] : []),
          ...(post.tags?.map((tag: any) => tag.name).join(', ') ? [{ property: 'article:tag', content: post.tags.map((tag: any) => tag.name).join(', ') }] : [])
        ]
      })
    }

    console.log('SEO meta tags set successfully for:', title)
  }

  /**
   * Set SEO meta tags for a list of posts (for archive pages)
   */
  const setPostsSeo = (posts: any[], pageTitle?: string, pageDescription?: string) => {
    if (!enabled || !posts || posts.length === 0) return

    const title = pageTitle || 'Posts'
    const description = pageDescription || `Browse our latest posts and articles.`

    if (useSeoMetaOption) {
      useSeoMeta({
        title: titleTemplate.replace('%s', title),
        description: descriptionTemplate.replace('%s', description),
        ogTitle: titleTemplate.replace('%s', title),
        ogDescription: descriptionTemplate.replace('%s', description),
        ogType: 'website',
      })
    } else {
      useHead({
        title: titleTemplate.replace('%s', title),
        meta: [
          { name: 'description', content: descriptionTemplate.replace('%s', description) },
          { property: 'og:title', content: titleTemplate.replace('%s', title) },
          { property: 'og:description', content: descriptionTemplate.replace('%s', description) },
          { property: 'og:type', content: 'website' }
        ]
      })
    }

    console.log('SEO meta tags set successfully for posts page:', title)
  }

  /**
   * Set SEO meta tags for a term (category, tag, etc.)
   */
  const setTermSeo = (term: any, termType: string) => {
    if (!enabled || !term) return

    const title = term.name || 'Term'
    const description = term.description || `Browse ${termType} posts.`

    if (useSeoMetaOption) {
      useSeoMeta({
        title: titleTemplate.replace('%s', title),
        description: descriptionTemplate.replace('%s', description),
        ogTitle: titleTemplate.replace('%s', title),
        ogDescription: descriptionTemplate.replace('%s', description),
        ogType: 'website',
      })
    } else {
      useHead({
        title: titleTemplate.replace('%s', title),
        meta: [
          { name: 'description', content: descriptionTemplate.replace('%s', description) },
          { property: 'og:title', content: titleTemplate.replace('%s', title) },
          { property: 'og:description', content: descriptionTemplate.replace('%s', description) },
          { property: 'og:type', content: 'website' }
        ]
      })
    }

    console.log('SEO meta tags set successfully for term:', title)
  }

  return {
    setPostSeo,
    setPostsSeo,
    setTermSeo
  }
} 