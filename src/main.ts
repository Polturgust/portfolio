import { createApp } from 'vue'
import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import 'lenis/dist/lenis.css'
import './styles/base.css'
import App from './App.vue'
import { vDraw, vLines, vMagnetic, vParallax, vReveal, vStagger, vUnveil } from './lib/motion'

createApp(App)
  .directive('reveal', vReveal)
  .directive('stagger', vStagger)
  .directive('lines', vLines)
  .directive('draw', vDraw)
  .directive('parallax', vParallax)
  .directive('unveil', vUnveil)
  .directive('magnetic', vMagnetic)
  .mount('#app')
