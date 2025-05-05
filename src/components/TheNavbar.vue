<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import axiosInstance from '@/axiosconfig/axiosInstance'
import useLogout from '@/composables/useLogout'

const { logout } = useLogout()
const isMobileMenuOpen = ref(false)
const user = ref(null)
const dropdownOpen = ref(false)
const dropdownRef = ref(null)


const fetchUserProfile = async () => {
  try {
    const response = await axiosInstance.get('/api/profile')
    user.value = response.data
  } catch (error) {
    console.error('Error fetching user profile:', error)
  }
}

onMounted(() => {
  fetchUserProfile()
})

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

const handleClickOutside = (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    dropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
<template>
  <header class="fixed w-full z-50 bg-gradient-to-r from-orange-200 to-green-900 shadow-md">
    <!-- Main Navigation -->
    <div class="max-w-7xl mx-auto px-6 py-3">
      <div class="flex justify-between items-center">
        <!-- Logo -->
        <router-link to="/" class="flex items-center space-x-3">
          <img src="@/assets/logos/logo1.png" class="h-12 mb-4" alt="City Radius CHS" />
        </router-link>

        <!-- Desktop Navigation -->
        <nav class="hidden lg:flex items-center space-x-6">
          <!-- Main Links -->
          <router-link to="/attendance" class="text-white hover:text-blue-100 transition flex items-center space-x-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>Attendance</span>
          </router-link>

          <router-link to="/schedule" class="text-white hover:text-blue-100 transition flex items-center space-x-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Schedule</span>
          </router-link>

          <router-link to="/time-off" class="text-white hover:text-blue-100 transition flex items-center space-x-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Time Off</span>
          </router-link>

          <!-- User Authentication Links -->
          <template v-if="user">
            <div class="relative" ref="dropdownRef">
              <button @click="toggleDropdown"
                class="flex items-center space-x-2 px-3 py-1 rounded-lg hover:bg-white/10 transition text-white">
                <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                  {{ user.name.charAt(0).toUpperCase() }}
                </div>
                <span>{{ user.name }}</span>
                <svg :class="[
                  'w-4 h-4 transition-transform duration-300',
                  dropdownOpen ? 'rotate-180' : ''
                ]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div v-if="dropdownOpen" class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-50 py-2">
                <router-link to="/profile"
                  class="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-blue-50 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>My Profile</span>
                </router-link>

                <button @click="logout"
                  class="flex items-center gap-3 w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </template>
          <template v-else>
            <router-link to="/login"
              class="px-4 py-1 rounded-lg border border-white text-white hover:bg-white hover:text-blue-600 transition">
              Login
            </router-link>
            <router-link to="/signup" class="px-4 py-1 rounded-lg bg-white text-blue-600 hover:bg-blue-50 transition">
              Sign Up
            </router-link>
          </template>
        </nav>

        <!-- Mobile Menu Button -->
        <button @click="isMobileMenuOpen = !isMobileMenuOpen"
          class="lg:hidden text-white p-2 rounded-lg hover:bg-white/10 transition">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Menu -->
    <transition enter-active-class="transition ease-out duration-100" enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100" leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100" leave-to-class="transform opacity-0 scale-95">
      <div v-if="isMobileMenuOpen" class="lg:hidden bg-blue-700 px-6 py-4 space-y-4">
        <router-link to="/attendance"
          class="block text-white hover:bg-white/10 px-3 py-2 rounded-lg transition flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span>Attendance</span>
        </router-link>

        <router-link to="/schedule"
          class="block text-white hover:bg-white/10 px-3 py-2 rounded-lg transition flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Schedule</span>
        </router-link>

        <router-link to="/time-off"
          class="block text-white hover:bg-white/10 px-3 py-2 rounded-lg transition flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Time Off</span>
        </router-link>

        <template v-if="user">
          <div class="pt-2 border-t border-white/10">
            <router-link to="/profile" class="block text-white hover:bg-white/10 px-3 py-2 rounded-lg transition">
              My Profile
            </router-link>
            <router-link to="/settings" class="block text-white hover:bg-white/10 px-3 py-2 rounded-lg transition">
              Settings
            </router-link>
            <button @click="logout"
              class="block w-full text-left text-white hover:bg-white/10 px-3 py-2 rounded-lg transition">
              Logout
            </button>
          </div>
        </template>
        <template v-else>
          <div class="pt-2 border-t border-white/10 space-y-2">
            <router-link to="/login"
              class="block text-center text-white border border-white px-4 py-2 rounded-lg hover:bg-white hover:text-blue-600 transition">
              Login
            </router-link>
            <router-link to="/signup"
              class="block text-center bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition">
              Sign Up
            </router-link>
          </div>
        </template>
      </div>
    </transition>
  </header>

  <!-- Spacer for fixed header -->
  <div class="h-20"></div>
</template>

<style scoped>
/* Smooth transitions */
.transition {
  transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
</style>
