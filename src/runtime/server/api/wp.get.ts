import { $fetch } from 'ofetch'
import type { H3Event } from 'h3'
import { defineEventHandler, getQuery, createError } from 'h3'
import type { ModuleOptions } from '../../../types'

export default defineEventHandler(async (event: H3Event) => {
  // Get query parameters
  const query = getQuery(event)
  
  // Get WordPress base URL from environment or config
  const wpBaseUrl = process.env.WP_BASE_URL || 'https://api.joseferreira.io'
  
  // Validate required configuration
  if (!wpBaseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'WordPress base URL not configured'
    })
  }

  // Get endpoint from query params
  const endpoint = query.endpoint as string
  if (!endpoint) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Endpoint parameter is required'
    })
  }

  // Build the full URL
  const url = `${wpBaseUrl}/wp-json/wp/v2/${endpoint}`

  try {
    // Forward the request to WordPress
    const response = await $fetch(url, {
      query: {
        ...query,
        endpoint: undefined // Remove endpoint from query params
      },
      headers: {
        'User-Agent': 'Nuxt WordPress REST API Module'
      }
    })

    return response
  } catch (error: any) {
    // Handle different types of errors
    if (error.statusCode) {
      throw createError({
        statusCode: error.statusCode,
        statusMessage: error.statusMessage || 'WordPress API error'
      })
    }

    // Network or other errors
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch from WordPress API'
    })
  }
})

function transformCarbonFields(item: unknown): unknown {
  if (!item || typeof item !== 'object') {
    return item
  }

  const itemObj = item as Record<string, unknown>

  // If item has meta field, extract Carbon Fields
  if (itemObj.meta && typeof itemObj.meta === 'object') {
    const meta = itemObj.meta as Record<string, unknown>
    const carbon: Record<string, unknown> = {}

    Object.keys(meta).forEach((key) => {
      // Carbon Fields typically start with underscore
      if (key.startsWith('_') && key !== '_edit_lock' && key !== '_edit_last') {
        const fieldName = key.substring(1)
        carbon[fieldName] = meta[key]
      }
    })

    if (Object.keys(carbon).length > 0) {
      itemObj.carbon = carbon
    }
  }

  return itemObj
}
