import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Museum',
    component: () => import('@/views/MuseumView.vue')
  },
  {
    path: '/showcase',
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
    path: '/market',
    name: 'Market',
    component: () => import('@/views/MarketView.vue')
  },
  {
    path: '/gacha',
    name: 'GachaWorkshop',
    component: () => import('@/views/GachaWorkshopView.vue')
  },
  {
    path: '/task',
    name: 'TaskCenter',
    component: () => import('@/views/TaskCenterView.vue')
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
