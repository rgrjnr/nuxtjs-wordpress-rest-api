<template>
  <div :class="`wp-block-wrapper-custom wp-block--${blockName.replace(/\//g, '-')}`" v-if="resolvedComponent">
    <component
      :is="resolvedComponent"
      v-bind="componentProps"
      :content="content"
      :inner-blocks="innerBlocks"
      :block-index="blockIndex"
      :block-name="blockName"
      :class="`${attributes.className}`"
      :id="attributes.id"
      @block-click="$emit('block-click', $event[0], $event[1])"
    />
  </div>

  <div v-else-if="innerBlocks && innerBlocks.length > 0" :class="`wp-block-wrapper-default wp-block--${blockName}`">
    <WpContent 
      :content="innerBlocksContent" 
      :parse-blocks="true"
      :block-overrides="blockOverrides"
      @block-click="$emit('block-click', $event[0], $event[1])"
    />
  </div>

  <div v-else :class="`wp-block-wrapper-default wp-block--${blockName}`" v-html="content" />
</template>

<script setup lang="ts">
import { computed, getCurrentInstance } from 'vue'
import { generateBlockComponentNames } from '../utils/component-discovery'

interface ParsedBlock {
  name: string
  attributes: Record<string, any>
  content: string
  innerBlocks: ParsedBlock[]
}

const props = defineProps<{
  blockName: string
  attributes: Record<string, any>
  content: string
  innerBlocks: ParsedBlock[]
  blockIndex: number
  blockOverrides?: Record<string, { component: any }>
}>()

const emit = defineEmits<{
  'block-click': [block: ParsedBlock, event: Event]
}>()

// Combine attributes as both individual props and as a single attributes prop
const componentProps = computed(() => {
  // Only pass the block attributes, not internal props
  return {
    ...props.attributes, // Spread individual attributes as props
    attributes: props.attributes, // Also pass as a single attributes prop
    content: props.content,
    innerBlocks: props.innerBlocks,
    blockIndex: props.blockIndex,
    blockName: props.blockName
  }
})

// Enhanced component resolution with multiple strategies
const resolvedComponent = computed(() => {
  const instance = getCurrentInstance()
  if (!instance) {
    return null
  }

  const components = instance.appContext.components

  // Strategy 1: Check for explicit blockOverrides (highest priority)
  if (props.blockOverrides?.[props.blockName]) {
    return props.blockOverrides[props.blockName].component
  }

  // Strategy 2: Generate possible component names for the block
  const blockNameVariants = generateBlockComponentNames(props.blockName)

  // Try each variant in order
  for (const componentName of blockNameVariants) {
    if (components[componentName]) {
      return components[componentName]
    }
  }

  return null
})

// Convert inner blocks back to content string for recursive parsing
const innerBlocksContent = computed(() => {
  if (!props.innerBlocks || props.innerBlocks.length === 0) {
    return ''
  }

  return props.innerBlocks.map(block => {
    let blockContent = `<!-- wp:${block.name}`
    
    // Add attributes if they exist
    if (Object.keys(block.attributes).length > 0) {
      blockContent += ` ${JSON.stringify(block.attributes)}`
    }
    
    blockContent += ' -->'
    
    // Add inner content
    if (block.innerBlocks && block.innerBlocks.length > 0) {
      // Recursively convert inner blocks
      const innerContent = block.innerBlocks.map(innerBlock => {
        let innerBlockContent = `<!-- wp:${innerBlock.name}`
        if (Object.keys(innerBlock.attributes).length > 0) {
          innerBlockContent += ` ${JSON.stringify(innerBlock.attributes)}`
        }
        innerBlockContent += ' -->'
        innerBlockContent += innerBlock.content
        innerBlockContent += `<!-- /wp:${innerBlock.name} -->`
        return innerBlockContent
      }).join('\n')
      blockContent += innerContent
    } else {
      blockContent += block.content
    }
    
    blockContent += `<!-- /wp:${block.name} -->`
    return blockContent
  }).join('\n')
})
</script>