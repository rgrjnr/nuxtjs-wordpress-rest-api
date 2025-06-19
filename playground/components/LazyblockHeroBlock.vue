<template>
  <div class="hero-block bg-gradient-to-r from-blue-500 to-purple-600 text-white p-8 rounded-lg">
    <div class="max-w-4xl mx-auto text-center">
      {{ attributes }}
      <h2 v-if="attributes.title" class="text-4xl font-bold mb-4">
        {{ attributes.title }}
      </h2>
      
      <p v-if="attributes.subtitle" class="text-xl mb-6 opacity-90">
        {{ attributes.subtitle }}
      </p>
      
      <div v-if="attributes.buttonText && attributes.buttonUrl" class="mt-6">
        <a 
          :href="attributes.buttonUrl" 
          class="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          {{ attributes.buttonText }}
        </a>
      </div>
    </div>
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

<style scoped>
.hero-block {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  padding: 4rem 2rem;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  line-height: 1.2;
}

.hero-description {
  font-size: 1.25rem;
  margin-bottom: 2rem;
  opacity: 0.9;
  line-height: 1.6;
}

.hero-button {
  margin-top: 2rem;
}

.btn {
  display: inline-block;
  padding: 1rem 2rem;
  background: white;
  color: #667eea;
  text-decoration: none;
  border-radius: 50px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.debug-info {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  max-width: 300px;
  z-index: 1000;
}

.debug-info p {
  margin: 0.25rem 0;
}
</style> 