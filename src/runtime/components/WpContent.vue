<template>
  <div :class="`wp-content wp-content-${post?.slug}`" :id="`wp-content-${post?.id}`">
    <div v-if="!post && !content" class="wp-content-empty">
      <slot />
    </div>
    <div v-else-if="parsedContent && parsedContent.length > 0" class="wp-content-blocks">
      <component
        v-for="(block, index) in parsedContent"
        :key="`${block.name}-${index}`"
        :is="getBlockComponent(block)"
        :attributes="block.attributes"
        :content="block.content"
        :inner-blocks="block.innerBlocks"
        :block-index="index"
        :block-name="block.name"
        :block-overrides="blockOverrides"
        @block-click="handleBlockClick"
      />
    </div>
    <div v-else class="wp-content-raw" v-html="finalContent" />
  </div>
</template>

<script setup lang="ts">
import { computed, resolveComponent, type PropType, watch } from 'vue'
// @ts-ignore - Nuxt internal alias
import { useRuntimeConfig } from '#app'

interface BlockAttribute {
  [key: string]: any
}

interface ParsedBlock {
  name: string
  attributes: BlockAttribute
  content: string
  innerBlocks: ParsedBlock[]
}

interface BlockOverride {
  component: any
  props?: Record<string, any>
}

interface WordPressPost {
  content?: {
    rendered?: string
    raw?: string
  }
  content_raw?: string
  [key: string]: any
}

const props = defineProps<{
  post?: WordPressPost
  content?: string
  blockOverrides?: Record<string, BlockOverride>
  parseBlocks?: boolean
  raw?: boolean
}>()

const emit = defineEmits<{
  'block-click': [block: ParsedBlock, event: Event]
}>()

// Get runtime config for default content type
const config = useRuntimeConfig()
const wpConfig = (config.public.wordpress as any) || {}

// Determine which content to use
const finalContent = computed(() => {
  // If direct content is provided, use it
  if (props.content) {
    return props.content
  }

  // If post object is provided, determine content type
  if (props.post) {
    const useRaw = props.raw !== undefined 
      ? props.raw 
      : wpConfig.defaultContentType === 'raw'

    if (useRaw) {
      // Try content_raw first, then content.raw, then fallback to rendered
      return props.post.content_raw || 
             props.post.content?.raw || 
             props.post.content?.rendered || ''
    } else {
      return props.post.content?.rendered || ''
    }
  }

  return ''
})

// Debug: Log when content changes
watch(() => finalContent.value, (newContent) => {
  // Debug logging removed for production
}, { immediate: true })

// Parse WordPress content into blocks
const parsedContent = computed(() => {
  if (!finalContent.value || !props.parseBlocks) {
    return null
  }

  try {
    // Simple block parser - in a real implementation, you'd use a more robust parser
    const blocks: ParsedBlock[] = []
    const content = finalContent.value

    // Find all block positions and sort them by their position in the content
    const blockMatches: Array<{match: RegExpMatchArray, index: number, isSelfClosing: boolean}> = []
    
    // Find self-closing blocks
    const selfClosingRegex = /<!--\s*wp:([^\/\s]+(?:\/[^\/\s]+)*)(?:\s+({[^}]*}))?\s*\/-->/g
    let match
    while ((match = selfClosingRegex.exec(content)) !== null) {
      blockMatches.push({
        match,
        index: match.index,
        isSelfClosing: true
      })
    }
    
    // Find regular blocks - improved regex to handle complex JSON attributes
    // Use a more sophisticated approach to find the opening and closing of blocks
    const blockStartRegex = /<!--\s*wp:([^\/\s]+(?:\/[^\/\s]+)*)(?:\s+[^>]*)?\s*-->/g
    let blockStartMatch
    
    while ((blockStartMatch = blockStartRegex.exec(content)) !== null) {
      const blockName = blockStartMatch[1]
      const startIndex = blockStartMatch.index
      const fullOpeningTag = blockStartMatch[0]
      
      // Check if this is a self-closing block (ends with /-->)
      if (fullOpeningTag.trim().endsWith('/-->')) {
        continue
      }
      
      let attributesJson = null
      
      // Try to extract JSON attributes from the opening tag
      const jsonMatch = fullOpeningTag.match(/\s+({.*})\s*-->$/)
      if (jsonMatch) {
        attributesJson = jsonMatch[1]
      }
      
      // Find the corresponding closing tag
      const closingTag = `<!-- /wp:${blockName} -->`
      const closingIndex = content.indexOf(closingTag, startIndex)
      
      if (closingIndex !== -1) {
        // Extract content between opening and closing tags
        const contentStart = startIndex + fullOpeningTag.length
        const blockContent = content.substring(contentStart, closingIndex).trim()
        
        // Create a mock match object for consistency
        const mockMatch = [fullOpeningTag + blockContent + closingTag, blockName, attributesJson, blockContent]
        
        blockMatches.push({
          match: mockMatch as RegExpMatchArray,
          index: startIndex,
          isSelfClosing: false
        })
      }
    }
    
    // Sort by position in content to maintain order
    blockMatches.sort((a, b) => a.index - b.index)
    
    // Process blocks in order
    for (const {match, isSelfClosing} of blockMatches) {
      const [, blockName, attributesJson, blockContent] = match

      let attributes: BlockAttribute = {}
      if (attributesJson) {
        try {
          attributes = JSON.parse(attributesJson)
        } catch {
          // Ignore invalid JSON
        }
      }

      if (isSelfClosing) {
        blocks.push({
          name: blockName,
          attributes,
          content: '', // Self-closing blocks have no content
          innerBlocks: []
        })
      } else {
        // Parse inner blocks recursively
        const innerBlocks = parseInnerBlocks(blockContent)

        blocks.push({
          name: blockName,
          attributes,
          content: blockContent,
          innerBlocks
        })
      }
    }

    return blocks
  } catch (error) {
    console.warn('WpContent: Failed to parse WordPress blocks:', error)
    return null
  }
})

// Parse inner blocks recursively
const parseInnerBlocks = (content: string): ParsedBlock[] => {
  const blocks: ParsedBlock[] = []
  
  // Find all block positions and sort them by their position in the content
  const blockMatches: Array<{match: RegExpMatchArray, index: number, isSelfClosing: boolean}> = []
  
  // Find self-closing blocks
  const selfClosingRegex = /<!--\s*wp:([^\/\s]+(?:\/[^\/\s]+)*)(?:\s+({[^}]*}))?\s*\/-->/g
  let match
  while ((match = selfClosingRegex.exec(content)) !== null) {
    blockMatches.push({
      match,
      index: match.index,
      isSelfClosing: true
    })
  }
  
  // Find regular blocks - use the same improved approach
  const blockStartRegex = /<!--\s*wp:([^\/\s]+(?:\/[^\/\s]+)*)(?:\s+[^>]*)?\s*-->/g
  let blockStartMatch
  
  while ((blockStartMatch = blockStartRegex.exec(content)) !== null) {
    const blockName = blockStartMatch[1]
    const startIndex = blockStartMatch.index
    const fullOpeningTag = blockStartMatch[0]
    
    // Check if this is a self-closing block (ends with /-->)
    if (fullOpeningTag.trim().endsWith('/-->')) {
      continue
    }
    
    let attributesJson = null
    
    // Try to extract JSON attributes from the opening tag
    const jsonMatch = fullOpeningTag.match(/\s+({.*})\s*-->$/)
    if (jsonMatch) {
      attributesJson = jsonMatch[1]
    }
    
    // Find the corresponding closing tag
    const closingTag = `<!-- /wp:${blockName} -->`
    const closingIndex = content.indexOf(closingTag, startIndex)
    
    if (closingIndex !== -1) {
      // Extract content between opening and closing tags
      const contentStart = startIndex + fullOpeningTag.length
      const blockContent = content.substring(contentStart, closingIndex).trim()
      
      // Create a mock match object for consistency
      const mockMatch = [fullOpeningTag + blockContent + closingTag, blockName, attributesJson, blockContent]
      
      blockMatches.push({
        match: mockMatch as RegExpMatchArray,
        index: startIndex,
        isSelfClosing: false
      })
    }
  }
  
  // Sort by position in content to maintain order
  blockMatches.sort((a, b) => a.index - b.index)
  
  // Process blocks in order
  for (const {match, isSelfClosing} of blockMatches) {
    const [, blockName, attributesJson, blockContent] = match

    let attributes: BlockAttribute = {}
    if (attributesJson) {
      try {
        attributes = JSON.parse(attributesJson)
      } catch {
        // Ignore invalid JSON
      }
    }

    if (isSelfClosing) {
      blocks.push({
        name: blockName,
        attributes,
        content: '', // Self-closing blocks have no content
        innerBlocks: []
      })
    } else {
      const innerBlocks = parseInnerBlocks(blockContent)

      blocks.push({
        name: blockName,
        attributes,
        content: blockContent,
        innerBlocks
      })
    }
  }

  return blocks
}

// Get the appropriate component for a block
const getBlockComponent = (block: ParsedBlock) => {
  // Always return WpBlock component - let it handle block overrides
  const WpBlockComponent = resolveComponent('WpBlock')
  
  // Fallback if WpBlock is not available
  if (!WpBlockComponent) {
    return 'div'
  }
  
  return WpBlockComponent
}

// Handle block click events
const handleBlockClick = (block: ParsedBlock, event: Event) => {
  emit('block-click', block, event)
}
</script>
