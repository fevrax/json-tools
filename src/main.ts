import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import App from './App.vue'

import './styles/main.css'

const app = createApp(App)

// 添加重定向规则
const redirectRoute = {
  path: '/',
  redirect: '/textView',
}

const router = createRouter({
  routes: [
    redirectRoute,
    ...routes,
  ],
  history: createWebHistory(import.meta.env.BASE_URL),
})

app.use(router)
app.mount('#app')
