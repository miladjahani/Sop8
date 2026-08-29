import { createRouter, createWebHashHistory } from 'vue-router';

const routes = [
  { path: '/', redirect: '/optimizer' },
  {
    path: '/optimizer',
    name: 'optimizer',
    component: () => import('../views/OptimizerView.vue'),
    meta: { title: '⚡ بهینه‌ساز', icon: '⚡' }
  },
  {
    path: '/scanner',
    name: 'scanner',
    component: () => import('../views/ScannerView.vue'),
    meta: { title: '🧪 اسکنر IP', icon: '🧪' }
  },
  {
    path: '/misub',
    name: 'misub',
    component: () => import('../views/SubscriptionsView.vue'),
    meta: { title: '📋 سابسکریپشن', icon: '📋' }
  },
  {
    path: '/tools',
    name: 'tools',
    component: () => import('../views/ToolsView.vue'),
    meta: { title: '🌐 ابزارها', icon: '🌐' }
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/SettingsView.vue'),
    meta: { title: '🛠️ تنظیمات', icon: '🛠️' }
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' };
  }
});

router.afterEach((to) => {
  document.title = `${to.meta.title || 'MiSub'} | CF-Optimizer`;
});

export default router;
