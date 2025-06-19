export interface ModuleOptions {
  /**
   * WordPress site base URL
   * @example 'https://example.com'
   */
  wpBaseUrl?: string

  /**
   * Default query parameters to include in all WP REST API requests
   * @default { _embed: true }
   */
  wpQueryDefaults?: Record<string, any>

  /**
   * Default content type preference
   * @default 'rendered'
   */
  defaultContentType?: 'rendered' | 'raw'

  /**
   * Error handling strategy
   * @default 'throw'
   */
  errorStrategy?: 'throw' | 'warn' | 'silent'

  /**
   * Custom error handler function (used when errorStrategy is 'custom')
   */
  errorHandler?: (error: any) => any

  /**
   * Route prefix for WordPress content
   * @default '/wp'
   */
  routePrefix?: string

  /**
   * Enable automatic route generation
   * @default true
   */
  enableAutoRouting?: boolean

  /**
   * Enable TypeScript type generation
   * @default true
   */
  enableTyping?: boolean

  /**
   * Enable SEO integration with @nuxtjs/seo
   * @default true
   */
  seoIntegration?: boolean

  /**
   * Custom post types to override/extend discovered ones
   */
  postTypes?: string[]

  /**
   * Custom taxonomies to override/extend discovered ones
   */
  taxonomies?: string[]

  /**
   * New options for block component discovery
   */
  blockComponents?: {
    enableAutoDiscovery?: boolean
    componentPaths?: string[]
    namingConventions?: string[]
    fallbackComponent?: string
  }
}

export interface WordPressSite {
  name: string
  description: string
  url: string
  home: string
  gmtOffset: number
  timezoneString: string
  namespaces: string[]
  authentication: Record<string, any>
  routes: Record<string, any>
}

export interface PostType {
  name: string
  slug: string
  restBase: string
  supports: Record<string, any>
  taxonomies: string[]
  capabilities: Record<string, any>
  labels: Record<string, any>
  description: string
  hierarchical: boolean
  hasArchive: boolean
  public: boolean
  publiclyQueryable: boolean
  showInMenu: boolean
  showInRest: boolean
  menuIcon: string
  menuPosition: number
  canExport: boolean
  deleteWithUser: boolean
  showInNavMenus: boolean
  mapMetaCap: boolean
  supportsTitle: boolean
  supportsEditor: boolean
  supportsThumbnail: boolean
  supportsExcerpt: boolean
  supportsCustomFields: boolean
  supportsComments: boolean
  supportsRevisions: boolean
  supportsAuthor: boolean
  supportsPageAttributes: boolean
  supportsPostFormats: boolean
  supportsTrackbacks: boolean
  supportsFeaturedImage: boolean
}

export interface Taxonomy {
  name: string
  slug: string
  restBase: string
  description: string
  hierarchical: boolean
  showCloud: boolean
  showInQuickEdit: boolean
  showAdminColumn: boolean
  metaBoxCb: any
  metaBoxSanitizeCb: any
  capabilities: Record<string, any>
  labels: Record<string, any>
  objectType: string[]
  public: boolean
  publiclyQueryable: boolean
  showUi: boolean
  showInMenu: boolean
  showInNavMenus: boolean
  showTagcloud: boolean
  showInRest: boolean
  restControllerClass: string
  restNamespace: string
  queryVar: boolean
  rewrite: boolean
  sort: boolean
  args: Record<string, any>
}

export interface WordPressDiscovery {
  site: WordPressSite
  postTypes: PostType[]
  taxonomies: Taxonomy[]
  endpoints: Record<string, string>
}

export interface WpDiscoveryData {
  postTypes: string[]
  taxonomies: string[]
  types: Record<string, any>
  taxonomyData: Record<string, any>
  lastFetched: number
}

export interface WpFetchOptions {
  /**
   * WordPress REST API endpoint path
   */
  endpoint: string

  /**
   * Query parameters
   */
  query?: Record<string, any>

  /**
   * Cache key for the request
   */
  key?: string

  /**
   * Whether to use server-side caching
   */
  server?: boolean

  /**
   * Transform the response data
   */
  transform?: (data: any) => any

  /**
   * Default value if request fails
   */
  default?: any
}

export interface UsePostOptions {
  /**
   * Post slug to fetch
   */
  slug?: string

  /**
   * Post type
   */
  type?: string

  /**
   * Additional query parameters
   */
  query?: Record<string, any>
}

export interface UsePostsOptions {
  /**
   * Post type to fetch
   */
  type?: string

  /**
   * Number of posts per page
   */
  per_page?: number

  /**
   * Page number
   */
  page?: number

  /**
   * Additional query parameters
   */
  query?: Record<string, any>
}

export interface UseTermOptions {
  /**
   * Term slug to fetch
   */
  slug?: string

  /**
   * Taxonomy name
   */
  taxonomy?: string

  /**
   * Additional query parameters
   */
  query?: Record<string, any>
}

export interface UseTermsOptions {
  /**
   * Taxonomy to fetch terms from
   */
  taxonomy?: string

  /**
   * Number of terms per page
   */
  per_page?: number

  /**
   * Page number
   */
  page?: number

  /**
   * Additional query parameters
   */
  query?: Record<string, any>
}
