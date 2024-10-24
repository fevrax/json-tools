import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import App from './App.vue'

import './styles/main.css'

const pinia = createPinia()
const app = createApp(App)

// // 添加重定向规则
// const redirectRoute = {
//   path: '/index.html',
//   redirect: '/',
// }

const router = createRouter({
  // utools 要启用 hash 模式
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    // redirectRoute,
    ...routes,
  ],
  // history: createWebHistory(import.meta.env.BASE_URL),
})

app.use(pinia)
app.use(router)
app.mount('#app')
