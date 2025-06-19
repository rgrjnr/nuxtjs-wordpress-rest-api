import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  declaration: true,
  entries: ['src/module'],
  externals: ['@nuxt/kit', '@nuxt/schema', 'nuxt/schema', 'nuxt', 'vue']
})
