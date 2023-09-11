import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import './index.css'


// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

const useDarkTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: useDarkTheme ? 'dark' : 'light',
  },
})

createApp(App).use(vuetify).mount('#app')
