# WordPress REST API Module for Nuxt 3

A comprehensive Nuxt 3 module for integrating with WordPress REST API, featuring automatic block component discovery and rendering.

## Features

- 🔄 **Automatic Block Component Discovery** - Automatically finds and renders Vue components for WordPress blocks
- 📝 **TypeScript Support** - Full TypeScript support with auto-generated types
- 🚀 **Auto-imports** - Automatic import of composables and components
- 🛣️ **Auto-routing** - Optional automatic route generation for WordPress content
- 🔍 **SEO Integration** - Built-in SEO support with @nuxtjs/seo
- 🎯 **Flexible Configuration** - Extensive configuration options

## Installation

```bash
npm install @nuxtjs/wordpress-rest-api
```

## Configuration

Add the module to your `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/wordpress-rest-api'
  ],
  wordpress: {
    wpBaseUrl: 'https://your-wordpress-site.com',
    enableAutoDiscovery: true,
    blockComponents: {
      enableAutoDiscovery: true,
      componentPaths: ['components/wp', 'components/blocks', 'components'],
      namingConventions: ['pascal', 'camel', 'kebab'],
      fallbackComponent: 'WpBlock'
    }
  }
})
```

## Automatic Block Component Discovery

The module automatically discovers and renders Vue components for WordPress blocks without requiring manual configuration.

### How It Works

1. **Component Naming**: The module generates multiple possible component names for each block
2. **Directory Scanning**: Scans configured directories for matching components
3. **Auto-import**: Automatically imports and registers discovered components
4. **Fallback Rendering**: Falls back to default rendering if no component is found

### Supported Naming Conventions

For a block named `namespace/block-name`, the module will look for components with these names in order of priority:

- `WpNamespaceBlockName` (Wp prefix + PascalCase)
- `NamespaceBlockName` (PascalCase)
- `BlockName` (Simplified PascalCase)
- `namespace-block-name` (kebab-case)

**Examples:**
- `lazyblock/hero-block` → `WpLazyblockHeroBlock`, `LazyblockHeroBlock`, `HeroBlock`, `lazyblock-hero-block`
- `acf/hero` → `WpAcfHero`, `AcfHero`, `Hero`, `acf-hero`
- `core/image` → `WpCoreImage`, `CoreImage`, `Image`, `core-image`
- `custom/test-block` → `WpCustomTestBlock`, `CustomTestBlock`, `TestBlock`, `custom-test-block`

### Component Structure

Create your block components with this structure:

```vue
<template>
  <div class="my-block">
    <h2>{{ attributes.title }}</h2>
    <p>{{ attributes.description }}</p>
    <div v-html="content"></div>
  </div>
</template>

<script setup>
defineProps({
  attributes: {
    type: Object,
    default: () => ({})
  },
  content: {
    type: String,
    default: ''
  },
  innerBlocks: {
    type: Array,
    default: () => []
  },
  blockIndex: {
    type: Number,
    default: 0
  },
  blockName: {
    type: String,
    required: true
  }
})
</script>
```

### Component Locations

By default, the module looks for components in these directories:

- `components/wp/` - WordPress-specific components
- `components/blocks/` - Block components
- `components/` - General components

### Manual Overrides

You can still provide manual block overrides if needed:

```vue
<template>
  <WpContent 
    :post="post" 
    :parse-blocks="true"
    :block-overrides="blockOverrides"
  />
</template>

<script setup>
import MyCustomBlock from '~/components/MyCustomBlock.vue'

const blockOverrides = {
  'lazyblock/hero-block': {
    component: MyCustomBlock
  }
}
</script>
```

## Composables

### usePost

Fetch a single WordPress post with automatic SEO integration:

```typescript
const { post, title, pending, error, exists, seoEnabled } = await usePost({
  slug: 'my-post',
  type: 'posts'
})
```

**Automatic SEO Integration**: When `seoIntegration` is enabled in your module configuration, `usePost` automatically sets SEO meta tags (title, description, Open Graph, Twitter cards) from the post data. This includes:

- **Title**: Post title
- **Description**: Post excerpt or content
- **Open Graph Image**: Featured image
- **Twitter Cards**: Same as Open Graph
- **Author**: Post author (if available)
- **Date**: Publication date

The SEO integration uses `useWpSeo` if available, or falls back to `useSeoMeta` from `@nuxtjs/seo`.

**Example with SEO Status**:
```vue
<template>
  <div>
    <!-- SEO Status Indicator -->
    <div v-if="seoEnabled" class="text-green-600">
      ✅ SEO automatically configured
    </div>
    
    <h1>{{ title }}</h1>
    <WpContent :post="post" :parse-blocks="true" />
  </div>
</template>

<script setup>
const { post, title, seoEnabled } = await usePost({
  slug: 'my-post'
})
</script>
```

### useWpSeo

Manual SEO management (optional when using `usePost`):

```typescript
const { setPostSeo, setCustomSeo } = useWpSeo({
  titleTemplate: '%s | My Site',
  descriptionTemplate: '%s - Read more on My Site',
  includeAuthor: true,
  includeDate: true
})

// Set SEO for a specific post
setPostSeo(post)

// Set custom SEO
setCustomSeo({
  title: 'Custom Title',
  description: 'Custom description',
  image: 'https://example.com/image.jpg'
})
```

### usePosts

Fetch multiple WordPress posts:

```typescript
const { posts, pending, error } = await usePosts({
  type: 'posts',
  per_page: 10
})
```

### useBlockComponents

Manage block component discovery:

```typescript
const { 
  discoverComponents, 
  getComponent, 
  hasComponent,
  getPossibleNames 
} = useBlockComponents()

// Discover components for a block
await discoverComponents('lazyblock/hero-block')

// Check if a component exists
const hasComponentForBlock = hasComponent('lazyblock/hero-block')

// Get possible component names
const possibleNames = getPossibleNames('lazyblock/hero-block')
```

## Components

### WpContent

Render WordPress content with automatic block parsing:

```vue
<template>
  <WpContent 
    :post="post" 
    :parse-blocks="true"
    :raw="false"
    @block-click="handleBlockClick"
  />
</template>
```

### WpBlock

Individual block component (used internally):

```vue
<template>
  <WpBlock 
    :block-name="blockName"
    :attributes="attributes"
    :content="content"
    :inner-blocks="innerBlocks"
  />
</template>
```

## Configuration Options

```typescript
interface ModuleOptions {
  wpBaseUrl?: string
  wpQueryDefaults?: Record<string, any>
  defaultContentType?: 'rendered' | 'raw'
  errorStrategy?: 'throw' | 'warn' | 'silent'
  routePrefix?: string
  enableAutoRouting?: boolean
  enableTyping?: boolean
  seoIntegration?: boolean
  blockComponents?: {
    enableAutoDiscovery?: boolean
    componentPaths?: string[]
    namingConventions?: string[]
    fallbackComponent?: string
  }
}
```

## Examples

### Basic Usage

```vue
<template>
  <div>
    <h1>{{ title }}</h1>
    <WpContent :post="post" :parse-blocks="true" />
  </div>
</template>

<script setup>
const { post, title } = await usePost({
  slug: 'my-post'
})
</script>
```

### Custom Block Component

```vue
<!-- components/LazyblockHeroBlock.vue -->
<template>
  <section class="hero">
    <h1>{{ attributes.title }}</h1>
    <p>{{ attributes.description }}</p>
    <a :href="attributes.buttonUrl">{{ attributes.buttonText }}</a>
  </section>
</template>

<script setup>
defineProps({
  attributes: Object,
  content: String,
  innerBlocks: Array,
  blockIndex: Number,
  blockName: String
})
</script>
```

## Development

### Testing

Run the playground to test the module:

```bash
cd playground
npm run dev
```

### Building

```bash
npm run build
```

## License

MIT