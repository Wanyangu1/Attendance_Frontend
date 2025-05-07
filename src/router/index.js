import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '@/pages/Registration/LoginPage.vue'
import SignupPage from '@/pages/Registration/SignupPage.vue'
import HomePage from '@/pages/Home/HomePage.vue'
import ProfilePage from '@/pages/Registration/ProfilePage.vue'
import SettingsPage from '@/pages/Registration/UserSettings.vue/SettingsPage.vue'
import AdminPage from '@/pages/Admin/AdminPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginPage,
    },
    {
      path: '/signup',
      name: 'signup',
      component: SignupPage,
    },
    {
      path: '/home',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfilePage,
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsPage,
    },
    {
      path: '/!admin-monitor!-page!',
      name: 'admin',
      component: AdminPage,
    },
  ],
})

export default router
