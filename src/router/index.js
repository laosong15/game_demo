import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import GameView from '../views/GameView.vue'
import SelectPlaneView from '../views/SelectPlaneView.vue'
import RankingView from '../views/RankingView.vue'
import EnemyTestView from '../views/EnemyTestView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL), // 改为hash模式，适合GitHub Pages部署
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/select-plane',
      name: 'selectPlane',
      component: SelectPlaneView,
    },
    {
      path: '/game',
      name: 'game',
      component: GameView,
    },
    {
      path: '/ranking',
      name: 'ranking',
      component: RankingView,
    },
    {
      path: '/enemy-test',
      name: 'enemyTest',
      component: EnemyTestView,
      meta: {
        // 标记为开发测试页面，不在主菜单中显示
        isDevPage: true
      }
    },
  ],
})

// 导航守卫已移除，不再在页面跳转后自动刷新

export default router
