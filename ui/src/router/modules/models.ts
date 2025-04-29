import Layout from '@/layout/layout-template/DetailLayout.vue'
import { ComplexPermission } from '@/utils/permission/type'

const ModelsRouter = {
  path: '/models',
  name: 'models',
  meta: { title: 'views.models.title', permission: 'APPLICATION:READ' },
  redirect: '/models',
  component: () => import('@/layout/layout-template/AppLayout.vue'),
  children: [
    {
      path: '/models',
      name: 'models-index',
      meta: { title: '本地模型库主页', activeMenu: '/models' },
      component: () => import('@/views/models/index.vue')
    },
    {
      path: '/models/:id/:type',
      name: 'modelsDetail',
      meta: { title: '模型详情', activeMenu: '/models' },
      component: Layout,
      hidden: true,
      children: [
        {
          path: 'overview',
          name: 'modelsOverview',
          meta: {
            icon: 'app-all-menu',
            iconActive: 'app-all-menu-active',
            title: 'views.modelsOverview.title',
            active: 'overview',
            parentPath: '/models/:id/:type',
            parentName: 'modelsDetail'
          },
          component: () => import('@/views/models-overview/index.vue')
        },
        {
          path: 'setting',
          name: 'modelsSetting',
          meta: {
            icon: 'app-setting',
            iconActive: 'app-setting-active',
            title: 'common.setting',
            active: 'setting',
            parentPath: '/models/:id/:type',
            parentName: 'modelsDetail'
          },
          component: () => import('@/views/models/ApplicationSetting.vue')
        },
        {
          path: 'access',
          name: 'modelsAccess',
          meta: {
            icon: 'app-access',
            iconActive: 'app-access-active',
            title: 'views.application.applicationAccess.title',
            active: 'access',
            parentPath: '/models/:id/:type',
            parentName: 'modelsDetail',
            permission: new ComplexPermission([], ['x-pack'], 'OR')
          },
          component: () => import('@/views/models/ApplicationAccess.vue')
        },
        {
          path: 'hit-test',
          name: 'AppHitTest',
          meta: {
            icon: 'app-hit-test',
            title: 'views.application.hitTest.title',
            active: 'hit-test',
            parentPath: '/models/:id/:type',
            parentName: 'modelsDetail'
          },
          component: () => import('@/views/hit-test/index.vue')
        },
        {
          path: 'log',
          name: 'Log',
          meta: {
            icon: 'app-document',
            iconActive: 'app-document-active',
            title: 'views.log.title',
            active: 'log',
            parentPath: '/models/:id/:type',
            parentName: 'modelsDetail'
          },
          component: () => import('@/views/log/index.vue')
        }
      ]
    }
  ]
}

export default ModelsRouter
