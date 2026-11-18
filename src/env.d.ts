declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

declare module 'v86/build/libv86.mjs' {
  export { V86 } from 'v86'
}
