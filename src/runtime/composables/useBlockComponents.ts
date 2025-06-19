import { ref, computed } from 'vue'
import { generateBlockComponentNames, discoverBlockComponents, getBestComponentMatch } from '../utils/component-discovery'
import type { ComponentDiscoveryOptions, DiscoveredComponent } from '../utils/component-discovery'

export interface UseBlockComponentsOptions {
  enableAutoDiscovery?: boolean
  componentPaths?: string[]
  namingConventions?: string[]
  fallbackComponent?: string
}

export function useBlockComponents(options: UseBlockComponentsOptions = {}) {
  const discoveredComponents = ref<Map<string, DiscoveredComponent[]>>(new Map())
  const componentCache = ref<Map<string, any>>(new Map())

  /**
   * Discover components for a specific block
   */
  const discoverComponents = (blockName: string, nuxtContext?: any) => {
    const discoveryOptions: ComponentDiscoveryOptions = {
      enableAutoDiscovery: options.enableAutoDiscovery ?? true,
      componentPaths: options.componentPaths ?? ['components/wp', 'components/blocks', 'components'],
      namingConventions: options.namingConventions ?? ['pascal', 'camel', 'kebab'],
      fallbackComponent: options.fallbackComponent ?? 'WpBlock'
    }

    const components = discoverBlockComponents(blockName, discoveryOptions, nuxtContext)
    discoveredComponents.value.set(blockName, components)
    return components
  }

  /**
   * Get the best matching component for a block
   */
  const getComponent = (blockName: string): any => {
    // Check cache first
    if (componentCache.value.has(blockName)) {
      return componentCache.value.get(blockName)
    }

    const components = discoveredComponents.value.get(blockName) || []
    const bestMatch = getBestComponentMatch(blockName, components, {
      enableAutoDiscovery: options.enableAutoDiscovery ?? true,
      componentPaths: options.componentPaths ?? ['components/wp', 'components/blocks', 'components'],
      namingConventions: options.namingConventions ?? ['pascal', 'camel', 'kebab'],
      fallbackComponent: options.fallbackComponent ?? 'WpBlock'
    })

    if (bestMatch) {
      componentCache.value.set(blockName, bestMatch)
      return bestMatch
    }

    return null
  }

  /**
   * Generate possible component names for a block
   */
  const getPossibleNames = (blockName: string): string[] => {
    return generateBlockComponentNames(blockName)
  }

  /**
   * Check if a component exists for a block
   */
  const hasComponent = (blockName: string): boolean => {
    const components = discoveredComponents.value.get(blockName) || []
    return components.length > 0
  }

  /**
   * Get all discovered components for a block
   */
  const getDiscoveredComponents = (blockName: string): DiscoveredComponent[] => {
    return discoveredComponents.value.get(blockName) || []
  }

  /**
   * Clear the component cache
   */
  const clearCache = () => {
    componentCache.value.clear()
    discoveredComponents.value.clear()
  }

  /**
   * Pre-discover components for multiple blocks
   */
  const preloadComponents = (blockNames: string[], nuxtContext?: any) => {
    blockNames.forEach(blockName => discoverComponents(blockName, nuxtContext))
  }

  return {
    discoverComponents,
    getComponent,
    getPossibleNames,
    hasComponent,
    getDiscoveredComponents,
    clearCache,
    preloadComponents,
    discoveredComponents: computed(() => discoveredComponents.value),
    componentCache: computed(() => componentCache.value)
  }
} 