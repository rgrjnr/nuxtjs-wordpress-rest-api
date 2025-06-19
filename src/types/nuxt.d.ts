declare module '#app' {
  export function useRoute(): any
  export function useLazyAsyncData<T>(key: string, handler: () => Promise<T>, options?: any): any
  export function useRuntimeConfig(): any
  export function defineNuxtPlugin(plugin: any): any
  export function defineEventHandler(handler: any): any
  export function getQuery(event: any): any
  export function createError(options: any): any
  export function resolveComponent(name: string): any
}

declare module '#imports' {
  export * from 'nuxt/dist/imports'
}

declare module '#build' {
  export * from 'nuxt/dist/core/runtime/nitro/build'
}

declare module '#nitro' {
  export * from 'nuxt/dist/core/runtime/nitro'
}

// Global declarations for Nitro server functions
declare global {
  function useRuntimeConfig(): any
  function defineEventHandler(handler: any): any
  function getQuery(event: any): any
  function createError(options: any): any
}
