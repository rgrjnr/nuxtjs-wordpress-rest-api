import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'pathe'
import { $fetch } from 'ofetch'
import { logger } from '@nuxt/kit'
import type { Nuxt } from '@nuxt/schema'
import type { WpDiscoveryData, WordPressDiscovery, PostType, Taxonomy } from '../../types'

const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export async function discoverWordPressTypes(
  wpBaseUrl: string,
  nuxt: Nuxt
): Promise<WpDiscoveryData | null> {
  try {
    const cacheFile = join(nuxt.options.buildDir, 'wp-types.json')

    // Try to read cached data first
    const cachedData = await readCachedData(cacheFile)
    if (cachedData && Date.now() - cachedData.lastFetched < CACHE_DURATION) {
      logger.info('Using cached WordPress types')
      return cachedData
    }

    logger.info('Discovering WordPress types and taxonomies...')

    // Fetch types and taxonomies
    const [typesResponse, taxonomiesResponse] = await Promise.all([
      $fetch(`${wpBaseUrl}/wp-json/wp/v2/types`),
      $fetch(`${wpBaseUrl}/wp-json/wp/v2/taxonomies`)
    ])

    // Extract post types
    const postTypes = Object.keys(typesResponse).filter((type) => {
      const typeData = typesResponse[type]
      return typeData.public !== false && typeData.show_in_rest !== false
    })

    // Extract taxonomies
    const taxonomies = Object.keys(taxonomiesResponse).filter((taxonomy) => {
      const taxonomyData = taxonomiesResponse[taxonomy]
      return taxonomyData.public !== false && taxonomyData.show_in_rest !== false
    })

    const discoveryData: WpDiscoveryData = {
      postTypes,
      taxonomies,
      types: typesResponse,
      taxonomyData: taxonomiesResponse,
      lastFetched: Date.now()
    }

    // Cache the results
    await cacheDiscoveryData(cacheFile, discoveryData)

    logger.success(`Discovered ${postTypes.length} post types and ${taxonomies.length} taxonomies`)
    return discoveryData
  } catch (error) {
    logger.warn('Failed to discover WordPress types:', error)

    // Try to return cached data even if expired
    const cacheFile = join(nuxt.options.buildDir, 'wp-types.json')
    const cachedData = await readCachedData(cacheFile)
    if (cachedData) {
      logger.info('Using expired cached WordPress types')
      return cachedData
    }

    return null
  }
}

async function readCachedData(cacheFile: string): Promise<WpDiscoveryData | null> {
  try {
    const data = await readFile(cacheFile, 'utf-8')
    return JSON.parse(data)
  } catch {
    return null
  }
}

async function cacheDiscoveryData(cacheFile: string, data: WpDiscoveryData): Promise<void> {
  try {
    // Ensure the directory exists
    await mkdir(join(cacheFile, '..'), { recursive: true })
    await writeFile(cacheFile, JSON.stringify(data, null, 2))
  } catch (error) {
    logger.warn('Failed to cache WordPress types:', error)
  }
}

export function extractCarbonFields(metaData: Record<string, any>): Record<string, any> {
  const carbonFields: Record<string, any> = {}

  // Carbon Fields typically stores data with '_' prefix
  Object.keys(metaData).forEach((key) => {
    if (key.startsWith('_') && key !== '_edit_lock' && key !== '_edit_last') {
      const fieldName = key.substring(1)
      carbonFields[fieldName] = metaData[key]
    }
  })

  return carbonFields
}

/**
 * Discover WordPress site structure and available endpoints
 */
export async function discoverWordPress(baseUrl: string): Promise<WordPressDiscovery> {
  try {
    // Fetch site info
    const siteInfo = await $fetch(`${baseUrl}/wp-json/`)

    // Fetch post types
    const postTypes = await $fetch(`${baseUrl}/wp-json/wp/v2/types`)

    // Fetch taxonomies
    const taxonomies = await $fetch(`${baseUrl}/wp-json/wp/v2/taxonomies`)

    // Transform post types
    const transformedPostTypes: PostType[] = Object.entries(postTypes).map(
      ([name, postType]: [string, any]) => ({
        name,
        slug: postType.slug,
        restBase: postType.rest_base,
        supports: postType.supports || {},
        taxonomies: postType.taxonomies || [],
        capabilities: postType.capabilities || {},
        labels: postType.labels || {},
        description: postType.description || '',
        hierarchical: postType.hierarchical || false,
        hasArchive: postType.has_archive || false,
        public: postType.public || false,
        publiclyQueryable: postType.publicly_queryable || false,
        showInMenu: postType.show_in_menu || false,
        showInRest: postType.show_in_rest || false,
        menuIcon: postType.menu_icon || '',
        menuPosition: postType.menu_position || 0,
        canExport: postType.can_export || false,
        deleteWithUser: postType.delete_with_user || false,
        showInNavMenus: postType.show_in_nav_menus || false,
        mapMetaCap: postType.map_meta_cap || false,
        supportsTitle: postType.supports?.title || false,
        supportsEditor: postType.supports?.editor || false,
        supportsThumbnail: postType.supports?.['thumbnail'] || false,
        supportsExcerpt: postType.supports?.excerpt || false,
        supportsCustomFields: postType.supports?.['custom-fields'] || false,
        supportsComments: postType.supports?.comments || false,
        supportsRevisions: postType.supports?.revisions || false,
        supportsAuthor: postType.supports?.author || false,
        supportsPageAttributes: postType.supports?.['page-attributes'] || false,
        supportsPostFormats: postType.supports?.['post-formats'] || false,
        supportsTrackbacks: postType.supports?.trackbacks || false,
        supportsFeaturedImage: postType.supports?.['thumbnail'] || false
      })
    )

    // Transform taxonomies
    const transformedTaxonomies: Taxonomy[] = Object.entries(taxonomies).map(
      ([name, taxonomy]: [string, any]) => ({
        name,
        slug: taxonomy.slug,
        restBase: taxonomy.rest_base,
        description: taxonomy.description || '',
        hierarchical: taxonomy.hierarchical || false,
        showCloud: taxonomy.show_cloud || false,
        showInQuickEdit: taxonomy.show_in_quick_edit || false,
        showAdminColumn: taxonomy.show_admin_column || false,
        metaBoxCb: taxonomy.meta_box_cb || null,
        metaBoxSanitizeCb: taxonomy.meta_box_sanitize_cb || null,
        capabilities: taxonomy.capabilities || {},
        labels: taxonomy.labels || {},
        objectType: taxonomy.object_type || [],
        public: taxonomy.public || false,
        publiclyQueryable: taxonomy.publicly_queryable || false,
        showUi: taxonomy.show_ui || false,
        showInMenu: taxonomy.show_in_menu || false,
        showInNavMenus: taxonomy.show_in_nav_menus || false,
        showTagcloud: taxonomy.show_tagcloud || false,
        showInRest: taxonomy.show_in_rest || false,
        restControllerClass: taxonomy.rest_controller_class || '',
        restNamespace: taxonomy.rest_namespace || '',
        queryVar: taxonomy.query_var || false,
        rewrite: taxonomy.rewrite || false,
        sort: taxonomy.sort || false,
        args: taxonomy.args || {}
      })
    )

    return {
      site: {
        name: siteInfo.name || '',
        description: siteInfo.description || '',
        url: siteInfo.url || baseUrl,
        home: siteInfo.home || baseUrl,
        gmtOffset: siteInfo.gmt_offset || 0,
        timezoneString: siteInfo.timezone_string || '',
        namespaces: siteInfo.namespaces || [],
        authentication: siteInfo.authentication || {},
        routes: siteInfo.routes || {}
      },
      postTypes: transformedPostTypes,
      taxonomies: transformedTaxonomies,
      endpoints: {
        posts: '/wp-json/wp/v2/posts',
        pages: '/wp-json/wp/v2/pages',
        categories: '/wp-json/wp/v2/categories',
        tags: '/wp-json/wp/v2/tags',
        users: '/wp-json/wp/v2/users',
        media: '/wp-json/wp/v2/media',
        comments: '/wp-json/wp/v2/comments'
      }
    }
  } catch (error: any) {
    throw new Error(`Failed to discover WordPress site: ${error.message}`)
  }
}

/**
 * Get available post types from discovery
 */
export function getPostTypes(discovery: WordPressDiscovery): PostType[] {
  return discovery.postTypes.filter((postType) => postType.public && postType.showInRest)
}

/**
 * Get available taxonomies from discovery
 */
export function getTaxonomies(discovery: WordPressDiscovery): Taxonomy[] {
  return discovery.taxonomies.filter((taxonomy) => taxonomy.public && taxonomy.showInRest)
}

/**
 * Get post types that support specific features
 */
export function getPostTypesWithSupport(
  discovery: WordPressDiscovery,
  support: string
): PostType[] {
  return discovery.postTypes.filter(
    (postType) => postType.public && postType.showInRest && postType.supports[support]
  )
}

/**
 * Get taxonomies for a specific post type
 */
export function getTaxonomiesForPostType(
  discovery: WordPressDiscovery,
  postTypeSlug: string
): Taxonomy[] {
  const postType = discovery.postTypes.find((pt) => pt.slug === postTypeSlug)
  if (!postType) return []

  return discovery.taxonomies.filter((taxonomy) => postType.taxonomies.includes(taxonomy.name))
}
