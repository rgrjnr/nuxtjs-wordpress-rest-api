import type { Nuxt } from '@nuxt/schema'
import type { WpDiscoveryData, PostType, Taxonomy } from '../../types'

export function generateVirtualRoutes(
  nuxt: Nuxt,
  discoveredData: WpDiscoveryData,
  routePrefix = '/wp'
) {
  const routes: any[] = []

  // Generate routes for post types
  discoveredData.postTypes.forEach((postType: string) => {
    const routePath = `${routePrefix}/${postType}/[...slug]`

    routes.push({
      name: `wp-${postType}`,
      path: routePath,
      file: `~/pages/wp/${postType}/[...slug].vue`,
      children: []
    })
  })

  // Generate routes for taxonomies
  discoveredData.taxonomies.forEach((taxonomy: string) => {
    const routePath = `${routePrefix}/${taxonomy}/[...slug]`

    routes.push({
      name: `wp-${taxonomy}`,
      path: routePath,
      file: `~/pages/wp/${taxonomy}/[...slug].vue`,
      children: []
    })
  })

  // Add virtual routes to Nuxt
  nuxt.hook('pages:extend', (pages) => {
    routes.forEach((route) => {
      // Check if the route file actually exists
      const routeExists = pages.some((page) => page.file === route.file)

      if (!routeExists) {
        // Create virtual route by adding to pages array
        // Note: We'll need to create actual files for this to work properly
        pages.push({
          name: route.name,
          path: route.path,
          file: route.file
        })
      }
    })
  })

  return routes
}

function generateVirtualPageContent(routeName: string, _routePath: string): string {
  const isPostType =
    routeName.includes('wp-') && !routeName.includes('category') && !routeName.includes('tag')

  if (isPostType) {
    return `<template>
  <div>
    <div v-if="pending">Loading...</div>
    <div v-else-if="error">
      <h1>Content Not Found</h1>
      <p>The requested content could not be found.</p>
    </div>
    <div v-else-if="post">
      <article>
        <header>
          <h1 v-html="post.title.rendered"></h1>
          <div class="meta">
            <time :datetime="post.date">{{ formatDate(post.date) }}</time>
          </div>
        </header>
        <WpContent :html="post.content.rendered" />
      </article>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const slug = Array.isArray(route.params.slug) ? route.params.slug.join('/') : route.params.slug

const { data: post, pending, error } = await usePost({
  slug,
  type: '${routeName.replace('wp-', '')}'
})

// SEO
if (post.value) {
  useSeoMeta({
    title: post.value.title.rendered,
    description: post.value.excerpt.rendered.replace(/<[^>]*>/g, '').substring(0, 160),
    ogTitle: post.value.title.rendered,
    ogDescription: post.value.excerpt.rendered.replace(/<[^>]*>/g, '').substring(0, 160),
    ogUrl: post.value.link,
    twitterCard: 'summary_large_image'
  })
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString()
}
</script>`
  } else {
    return `<template>
  <div>
    <div v-if="pending">Loading...</div>
    <div v-else-if="error">
      <h1>Terms Not Found</h1>
      <p>The requested taxonomy terms could not be found.</p>
    </div>
    <div v-else-if="term">
      <header>
        <h1 v-html="term.name"></h1>
        <div v-if="term.description" v-html="term.description"></div>
      </header>

      <div v-if="posts && posts.length">
        <div class="posts-grid">
          <article v-for="post in posts" :key="post.id" class="post-card">
            <h2>
              <NuxtLink :to="post.link">
                <span v-html="post.title.rendered"></span>
              </NuxtLink>
            </h2>
            <div v-html="post.excerpt.rendered"></div>
          </article>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const slug = Array.isArray(route.params.slug) ? route.params.slug.join('/') : route.params.slug

const { data: term, pending, error } = await useTerm({
  slug,
  taxonomy: '${routeName.replace('wp-', '')}'
})

const { data: posts } = await usePosts({
  query: {
    [term.value?.taxonomy]: [term.value?.id]
  }
})

// SEO
if (term.value) {
  useSeoMeta({
    title: term.value.name,
    description: term.value.description?.replace(/<[^>]*>/g, '').substring(0, 160) || \`Posts in \${term.value.name}\`,
    ogTitle: term.value.name,
    ogDescription: term.value.description?.replace(/<[^>]*>/g, '').substring(0, 160) || \`Posts in \${term.value.name}\`
  })
}
</script>

<style scoped>
.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.post-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
}

.post-card h2 {
  margin: 0 0 1rem 0;
}

.post-card a {
  color: #2563eb;
  text-decoration: none;
}

.post-card a:hover {
  text-decoration: underline;
}
</style>`
  }
}

/**
 * Generate virtual routes for WordPress post types
 */
export function generatePostTypeRoutes(postTypes: PostType[], prefix = '/wp'): string[] {
  return postTypes
    .filter((postType) => postType.public && postType.showInRest)
    .map((postType) => {
      const slug = postType.slug === 'post' ? '' : `/${postType.slug}`
      return `${prefix}${slug}/[...slug].vue`
    })
}

/**
 * Generate virtual routes for WordPress taxonomies
 */
export function generateTaxonomyRoutes(taxonomies: Taxonomy[], prefix = '/wp'): string[] {
  return taxonomies
    .filter((taxonomy) => taxonomy.public && taxonomy.showInRest)
    .map((taxonomy) => {
      const slug =
        taxonomy.slug === 'category'
          ? 'categories'
          : taxonomy.slug === 'post_tag'
            ? 'tags'
            : taxonomy.slug
      return `${prefix}/${slug}/[...slug].vue`
    })
}

/**
 * Generate archive routes for post types
 */
export function generateArchiveRoutes(postTypes: PostType[], prefix = '/wp'): string[] {
  return postTypes
    .filter((postType) => postType.public && postType.showInRest && postType.hasArchive)
    .map((postType) => {
      const slug = postType.slug === 'post' ? '' : `/${postType.slug}`
      return `${prefix}${slug}/index.vue`
    })
}

/**
 * Generate taxonomy archive routes
 */
export function generateTaxonomyArchiveRoutes(taxonomies: Taxonomy[], prefix = '/wp'): string[] {
  return taxonomies
    .filter((taxonomy) => taxonomy.public && taxonomy.showInRest)
    .map((taxonomy) => {
      const slug =
        taxonomy.slug === 'category'
          ? 'categories'
          : taxonomy.slug === 'post_tag'
            ? 'tags'
            : taxonomy.slug
      return `${prefix}/${slug}/index.vue`
    })
}

/**
 * Generate all virtual routes for WordPress content
 */
export function generateAllRoutes(
  postTypes: PostType[],
  taxonomies: Taxonomy[],
  prefix = '/wp'
): string[] {
  const routes: string[] = []

  // Post type single pages
  routes.push(...generatePostTypeRoutes(postTypes, prefix))

  // Post type archives
  routes.push(...generateArchiveRoutes(postTypes, prefix))

  // Taxonomy single pages
  routes.push(...generateTaxonomyRoutes(taxonomies, prefix))

  // Taxonomy archives
  routes.push(...generateTaxonomyArchiveRoutes(taxonomies, prefix))

  return routes
}

/**
 * Get route name for a post type
 */
export function getPostTypeRouteName(postType: PostType): string {
  return `wp-${postType.slug}`
}

/**
 * Get route name for a taxonomy
 */
export function getTaxonomyRouteName(taxonomy: Taxonomy): string {
  const slug =
    taxonomy.slug === 'category'
      ? 'categories'
      : taxonomy.slug === 'post_tag'
        ? 'tags'
        : taxonomy.slug
  return `wp-${slug}`
}

/**
 * Get route path for a post type
 */
export function getPostTypeRoutePath(postType: PostType, prefix = '/wp'): string {
  const slug = postType.slug === 'post' ? '' : `/${postType.slug}`
  return `${prefix}${slug}/[...slug]`
}

/**
 * Get route path for a taxonomy
 */
export function getTaxonomyRoutePath(taxonomy: Taxonomy, prefix = '/wp'): string {
  const slug =
    taxonomy.slug === 'category'
      ? 'categories'
      : taxonomy.slug === 'post_tag'
        ? 'tags'
        : taxonomy.slug
  return `${prefix}/${slug}/[...slug]`
}

/**
 * Check if a route matches a post type
 */
export function isPostTypeRoute(routeName: string, postType: PostType): boolean {
  return routeName === getPostTypeRouteName(postType)
}

/**
 * Check if a route matches a taxonomy
 */
export function isTaxonomyRoute(routeName: string, taxonomy: Taxonomy): boolean {
  return routeName === getTaxonomyRouteName(taxonomy)
}
