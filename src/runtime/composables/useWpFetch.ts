import { $fetch, type FetchOptions } from 'ofetch'
import { defu } from 'defu'
import type { WpFetchOptions, ModuleOptions } from '../../types'
import { useRuntimeConfig } from '#app'

export async function useWpFetch<T = any>(options: WpFetchOptions): Promise<T> {
  const config = useRuntimeConfig()
  const wpConfig = (config.public.wordpress as Partial<ModuleOptions>) || {}

  if (!wpConfig?.wpBaseUrl) {
    throw new Error('WordPress base URL is not configured')
  }

  const query = defu(options.query || {}, wpConfig.wpQueryDefaults || {})
  const baseUrl = wpConfig.wpBaseUrl.replace(/\/$/, '')
  const url = `${baseUrl}/wp-json/wp/v2${options.endpoint}`

  try {
    const data = await $fetch<T>(url, { query })
    return options.transform ? options.transform(data) : data
  } catch (error) {
    switch (wpConfig.errorStrategy) {
      case 'null':
        return null as T
      case 'custom':
        if (wpConfig.errorHandler) {
          return wpConfig.errorHandler(error)
        }
        break
    }
    if (options.default !== undefined) return options.default
    throw error
  }
}

function transformCarbonFields(item: any): any {
  if (!item || typeof item !== 'object') {
    return item
  }

  // If item has meta field, extract Carbon Fields
  if (item.meta && typeof item.meta === 'object') {
    const carbon: Record<string, any> = {}

    Object.keys(item.meta).forEach((key) => {
      // Carbon Fields typically start with underscore
      if (key.startsWith('_') && key !== '_edit_lock' && key !== '_edit_last') {
        const fieldName = key.substring(1)
        carbon[fieldName] = item.meta[key]
      }
    })

    if (Object.keys(carbon).length > 0) {
      item.carbon = carbon
    }
  }

  return item
}

// Server-side fetch utility
export const useWpFetchServer = async <T = any>(options: WpFetchOptions): Promise<T> => {
  // Force server-side execution
  return useWpFetch<T>({ ...options })
}

// Client-side fetch utility
export const useWpFetchClient = async <T = any>(options: WpFetchOptions): Promise<T> => {
  // Force client-side execution
  return useWpFetch<T>({ ...options })
}
