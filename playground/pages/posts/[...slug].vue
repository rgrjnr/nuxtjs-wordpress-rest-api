<template>
  <div class="container mx-auto p-4">
    <div v-if="pending" class="text-center py-8">Loading post...</div>

    <div v-else-if="error" class="text-center py-8">
      <h1 class="text-3xl font-bold text-red-600 mb-4">Post Not Found</h1>
      <p class="text-gray-600">The requested post could not be found.</p>
      <NuxtLink to="/" class="text-blue-600 hover:underline mt-4 inline-block">
        ← Back to Home
      </NuxtLink>
    </div>

    <article v-else-if="post" class="max-w-4xl mx-auto">
      <header class="mb-8">
        <h1 class="text-4xl font-bold mb-4" v-html="post.title.rendered" />
        <div class="flex items-center text-gray-600 text-sm space-x-4">
          <time :datetime="post.date">
            {{ formatDate(post.date) }}
          </time>
          <span v-if="author">by {{ author.name }}</span>
        </div>
      </header>

      <div v-if="featuredImage" class="mb-8">
        <img
          :src="featuredImage.source_url"
          :alt="featuredImage.alt_text"
          class="w-full h-auto rounded"
        />
      </div>

      <div class="prose prose-lg max-w-none">
        <WpContent :html="post.content.rendered" />
      </div>

      <footer class="mt-8 pt-8 border-t">
        <div v-if="categories.length" class="mb-4">
          <span class="font-semibold">Categories: </span>
          <span v-for="(category, index) in categories" :key="category.id">
            <NuxtLink :to="`/wp/categories/${category.slug}`" class="text-blue-600 hover:underline">
              {{ category.name }}
            </NuxtLink>
            <span v-if="index < categories.length - 1">, </span>
          </span>
        </div>

        <div v-if="tags.length">
          <span class="font-semibold">Tags: </span>
          <span v-for="(tag, index) in tags" :key="tag.id">
            <NuxtLink :to="`/wp/tags/${tag.slug}`" class="text-blue-600 hover:underline">
              {{ tag.name }}
            </NuxtLink>
            <span v-if="index < tags.length - 1">, </span>
          </span>
        </div>
      </footer>
    </article>
  </div>
</template>

<script setup lang="ts">
const { post, pending, error, author, featuredImage, categories, tags } = usePost()

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>
