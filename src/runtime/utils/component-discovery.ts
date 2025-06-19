export interface ComponentDiscoveryOptions {
  enableAutoDiscovery?: boolean
  componentPaths?: string[]
  namingConventions?: string[]
  fallbackComponent?: string
}

export interface DiscoveredComponent {
  name: string
  path: string
  blockName: string
  priority: number
}

/**
 * Generate possible component names for a block
 */
export function generateBlockComponentNames(blockName: string): string[] {
  const names: string[] = []
  
  // Helper function to convert kebab-case to PascalCase
  const toPascalCase = (str: string): string => {
    return str
      .split(/[-_]/) // Split by dash or underscore
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
  }
  
  // Handle namespaced blocks (e.g., "namespace/block-name")
  if (blockName.includes('/')) {
    const parts = blockName.split('/')
    if (parts.length === 2) {
      const [namespace, name] = parts
      const namePascalCase = toPascalCase(name)
      const namespacePascalCase = toPascalCase(namespace)
      
      names.push(`Wp${namespacePascalCase}${namePascalCase}`) // WpLazyblockHeroBlock
      names.push(`${namespacePascalCase}${namePascalCase}`)   // LazyblockHeroBlock
      names.push(`${namePascalCase}`)                         // HeroBlock
      names.push(`${namespace}-${name}`)                      // lazyblock-hero-block
    }
  } else {
    // Handle blocks without namespace
    const pascalCase = toPascalCase(blockName)
    names.push(`Wp${pascalCase}`)                             // WpParagraph
    names.push(`${pascalCase}`)                               // Paragraph
    names.push(`${blockName}`)                                // paragraph
  }
  
  return [...new Set(names)] // Remove duplicates
}

/**
 * Discover components that match block names from Vue's component registry
 */
export function discoverBlockComponents(
  blockName: string,
  options: ComponentDiscoveryOptions,
  nuxtContext?: any
): DiscoveredComponent[] {
  const discovered: DiscoveredComponent[] = []
  
  if (!options.enableAutoDiscovery) {
    return discovered
  }
  
  const possibleNames = generateBlockComponentNames(blockName)
  
  // Check if components are already registered in Nuxt/Vue
  if (nuxtContext?.appContext?.components) {
    const components = nuxtContext.appContext.components
    
    for (const name of possibleNames) {
      if (components[name]) {
        discovered.push({
          name,
          path: 'registered',
          blockName,
          priority: 1
        })
      }
    }
  }
  
  // Sort by priority (lower number = higher priority)
  return discovered.sort((a, b) => a.priority - b.priority)
}

/**
 * Get the best matching component for a block
 */
export function getBestComponentMatch(
  blockName: string,
  discoveredComponents: DiscoveredComponent[],
  options: ComponentDiscoveryOptions
): string | null {
  if (discoveredComponents.length === 0) {
    return options.fallbackComponent || null
  }
  
  // Return the first (highest priority) component
  return discoveredComponents[0].name
} 