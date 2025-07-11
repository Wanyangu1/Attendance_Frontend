import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '@/pages/Registration/LoginPage.vue'
import SignupPage from '@/pages/Registration/SignupPage.vue'
import HomePage from '@/pages/Home/HomePage.vue'
import ProfilePage from '@/pages/Registration/ProfilePage.vue'
import SettingsPage from '@/pages/Registration/UserSettings.vue/SettingsPage.vue'
import AdminPage from '@/pages/Admin/AdminPage.vue'
import PasswordChange from '@/pages/Registration/PasswordChange.vue'
import ProviderPage from '@/pages/Home/Provider/ProviderPage.vue'
import AttendanceLogs from '@/pages/Home/Provider/DailyAttendance/AttendanceLogs.vue'
import TimeSheet from '@/pages/Home/Provider/Timesheet/TimeSheet.vue'
import AddNotes from '@/pages/Home/Provider/DailyAttendance/AddNotes.vue'
import NewRecord from '@/pages/Home/Provider/DailyAttendance/NewRecord.vue'
import ClientList from '@/pages/Home/Client/ClientList.vue'

const routes = [
  {
    path: '/',
    name: 'login',
    component: LoginPage,
  },
  {
    path: '/admin-Create-User/signup',
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
  {
    path: '/Change-Password',
    name: 'Change-Password',
    component: PasswordChange,
  },
  {
    path: '/provider',
    name: 'provider',
    component: ProviderPage,
  },
  {
    path: '/attendance-log',
    name: 'attendance-log',
    component: AttendanceLogs,
  },
  {
    path: '/timesheet',
    name: 'timesheet',
    component: TimeSheet,
  },
  {
    path: '/notes/:id',
    name: 'Notes',
    component: AddNotes,
    props: true,
  },
  {
    path: '/new-record',
    name: 'new-record',
    component: NewRecord,
  },
  {
    path: '/client',
    name: 'client',
    component: ClientList,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to) {
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
      }
    }
    return { top: 0 }
  },
})

export default router
