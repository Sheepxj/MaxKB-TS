import type { RouteRecordRaw } from 'vue-router'
import { Role } from '@/utils/permission/type'

const modules: any = import.meta.glob('./modules/*.ts', { eager: true })
const rolesRoutes: RouteRecordRaw[] = [...Object.keys(modules).map((key) => modules[key].default)]

export const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    redirect: '/application',
    children: [...rolesRoutes]
  },

  // 高级编排
  {
    path: '/application/:id/workflow',
    name: 'ApplicationWorkflow',
    meta: { activeMenu: '/application' },
    component: () => import('@/views/application-workflow/index.vue')
  },

  {
    path: '/chat/:accessToken',
    name: 'Chat',
    component: () => import('@/views/chat/index.vue')
  },
  // 新增 chat_south 路由配置
  {
    path: '/chat_south/:accessToken',  // ← 新增路由路径
    name: 'ChatSouth',
    component: () => import('@/views/chat_south/index.vue')  // ← 对应新组件路径
  },

  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login/index.vue')
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/login/register/index.vue')
  },
  {
    path: '/forgot_password',
    name: 'forgot_password',
    component: () => import('@/views/login/forgot-password/index.vue')
  },
  {
    path: '/reset_password/:code/:email',
    name: 'reset_password',
    component: () => import('@/views/login/reset-password/index.vue')
  },
  {
    path: '/:pathMatch(.*)',
    name: '404',
    component: () => import('@/views/404/index.vue')
  }
]
