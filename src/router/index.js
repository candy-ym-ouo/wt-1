import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Showcase',
    component: () => import('@/views/ShowcaseView.vue')
  },
  {
    path: '/expedition',
    name: 'Expedition',
    component: () => import('@/views/ExpeditionView.vue')
  },
  {
    path: '/collage',
    name: 'Collage',
    component: () => import('@/views/CollageView.vue')
  },
  {
    path: '/collection',
    name: 'Collection',
    component: () => import('@/views/CollectionView.vue')
  },
  {
    path: '/mineral/:id',
    name: 'MineralDetail',
    component: () => import('@/views/MineralDetailView.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
