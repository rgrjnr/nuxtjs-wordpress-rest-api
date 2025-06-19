<template>
  <div class="container mx-auto p-8">
    <h1 class="text-3xl font-bold mb-8">Custom Blocks Test - Auto Discovery</h1>

    <!-- SEO Debug Info -->
    <div v-if="post" class="mb-4 p-4 bg-blue-50 rounded">
      <h4 class="font-semibold text-blue-800">SEO Debug Info:</h4>
      <p class="text-sm text-blue-700">Title: {{ post.title?.rendered }}</p>
      <p class="text-sm text-blue-700">SEO Enabled: {{ seoEnabled }}</p>
      <p class="text-sm text-blue-700">Post Loaded: {{ !!post }}</p>
    </div>

    <div v-if="pending" class="text-gray-600">Loading post...</div>
    <div v-else-if="error" class="text-red-600">Error: {{ error }}</div>
    <div v-else-if="!exists" class="text-red-600">Post not found</div>
    <div v-else class="max-w-4xl mx-auto">
      <h2 class="text-2xl font-semibold mb-4">{{ title }}</h2>

      <!-- Block Parsing Test -->
      <div class="mt-8">
        <h3 class="text-xl font-semibold mb-4">Block Parsing Test (Auto Discovery)</h3>

        <pre class="bg-gray-100 p-4 rounded mb-4 text-sm overflow-auto">{{ post.content_raw }}</pre>

        <WpContent 
          :post="post" 
          :raw="true"
          :parse-blocks="true"
          @block-click="handleBlockClick"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
// Test with a specific post slug - SEO is automatically handled by usePost composable
const { 
  post,
  title,
  pending, 
  error, 
  exists,
} = await usePost({
  slug: 'teste-de-components', // Use your actual post slug
  type: 'posts'
})

// Check if SEO integration is enabled
const config = useRuntimeConfig()
const seoEnabled = computed(() => config.public.wordpress?.seoIntegration !== false)

const handleBlockClick = (block, event) => {
  console.log('Block clicked:', block)
  console.log('Event:', event)
}
</script> 