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
  <header class="fixed w-full z-50 bg-gradient-to-r from-blue-300 to-blue-500 shadow-lg">
    <!-- Main Navigation -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo and Mobile Menu Button (left side) -->
        <div class="flex items-center">
          <!-- Mobile menu button -->
          <button @click="isMobileMenuOpen = !isMobileMenuOpen"
            class="lg:hidden text-white p-2 rounded-md hover:bg-white/10 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <!-- Logo -->
          <router-link to="/home" class="flex-shrink-0 flex items-center ml-2 lg:ml-0">
            <img src="@/assets/logos/logo1.png" class="h-10" alt="City Radius CHS" />
          </router-link>
        </div>

        <!-- Desktop Navigation (center) -->
        <nav class="hidden lg:flex lg:items-center lg:justify-center lg:space-x-6 lg:flex-1">
          <!-- Main Links -->
          <router-link to="/home"
            class="text-white bg-white/20 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-all duration-200"
            active-class="bg-white/20">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>My Information</span>
          </router-link>

          <router-link to="#workedhours"
            class="text-white bg-white/20 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-all duration-200"
            active-class="bg-white/20">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Schedule</span>
          </router-link>

          <router-link to="/time-off"
            class="text-white bg-white/20 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-all duration-200"
            active-class="bg-white/20">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Time Off</span>
          </router-link>
        </nav>

        <!-- User Controls (right side) -->
        <div class="flex border-2 p-1 rounded-full border-gray-100 items-center">
          <template v-if="user">
            <div class="relative ml-4" ref="dropdownRef">
              <button @click="toggleDropdown" class="flex items-center text-sm rounded-full focus:outline-none">
                <div class="h-7 w-7 rounded-full bg-white flex items-center justify-center text-teal-600 font-bold">
                  {{ user.name.charAt(0).toUpperCase() }}
                </div>
                <span class="ml-2 text-white hidden lg:inline">{{ user.name.split(' ')[0] }}</span>
                <svg :class="[
                  'ml-1 mr-3 h-4 w-4 text-white transition-transform duration-200',
                  dropdownOpen ? 'rotate-180' : ''
                ]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <!-- Dropdown menu -->
              <transition enter-active-class="transition ease-out duration-100"
                enter-from-class="transform opacity-0 scale-95" enter-to-class="transform opacity-100 scale-100"
                leave-active-class="transition ease-in duration-75" leave-from-class="transform opacity-100 scale-100"
                leave-to-class="transform opacity-0 scale-95">
                <div v-if="dropdownOpen"
                  class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1 z-50">
                  <router-link to="/profile"
                    class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-teal-50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-teal-500" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Profile</span>
                  </router-link>
                  <router-link to="/settings"
                    class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-teal-50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-teal-500" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Settings</span>
                  </router-link>
                  <div class="border-t border-gray-100"></div>
                  <button @click="logout"
                    class="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-red-500" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              </transition>
            </div>
          </template>
          <template v-else>
            <router-link to="/login"
              class="px-3 py-1 rounded-md border border-white text-white hover:bg-white hover:text-teal-600 transition text-sm font-medium hidden sm:block">
              Login
            </router-link>
            <router-link to="/signup"
              class="ml-2 px-3 py-1 rounded-md bg-white text-teal-600 hover:bg-teal-50 transition text-sm font-medium hidden sm:block">
              Sign Up
            </router-link>
          </template>
        </div>
      </div>
    </div>

    <!-- Mobile Menu -->
    <transition enter-active-class="transition ease-out duration-100" enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100" leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100" leave-to-class="transform opacity-0 scale-95">
      <div v-if="isMobileMenuOpen" class="lg:hidden bg-teal-600">
        <div class="px-2 pt-2 pb-3 space-y-1">
          <router-link to="/attendance"
            class="text-white hover:bg-white/10 block px-3 py-2 rounded-md text-base font-medium flex items-center"
            active-class="bg-white/20">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>Attendance</span>
          </router-link>

          <router-link to="/schedule"
            class="text-white hover:bg-white/10 block px-3 py-2 rounded-md text-base font-medium flex items-center"
            active-class="bg-white/20">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Schedule</span>
          </router-link>

          <router-link to="/time-off"
            class="text-white hover:bg-white/10 block px-3 py-2 rounded-md text-base font-medium flex items-center"
            active-class="bg-white/20">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Time Off</span>
          </router-link>
        </div>

        <div class="pt-4 pb-3 border-t border-teal-500">
          <template v-if="user">
            <div class="flex items-center px-5">
              <div
                class="flex-shrink-0 h-10 w-10 rounded-full bg-white flex items-center justify-center text-teal-600 font-bold">
                {{ user.name.charAt(0).toUpperCase() }}
              </div>
              <div class="ml-3">
                <div class="text-base font-medium text-white">{{ user.name }}</div>
                <div class="text-sm font-medium text-teal-100">{{ user.email }}</div>
              </div>
            </div>
            <div class="mt-3 px-2 space-y-1">
              <router-link to="/profile"
                class="block px-3 py-2 rounded-md text-base font-medium text-teal-100 hover:bg-white/10">
                Profile
              </router-link>
              <router-link to="/settings"
                class="block px-3 py-2 rounded-md text-base font-medium text-teal-100 hover:bg-white/10">
                Settings
              </router-link>
              <button @click="logout"
                class="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-teal-100 hover:bg-white/10">
                Logout
              </button>
            </div>
          </template>
          <template v-else>
            <div class="px-2 space-y-2">
              <router-link to="/login"
                class="block w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-teal-600 bg-white hover:bg-teal-50">
                Login
              </router-link>
              <router-link to="/signup"
                class="block w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-teal-500 hover:bg-teal-400">
                Sign Up
              </router-link>
            </div>
          </template>
        </div>
      </div>
    </transition>
  </header>

  <!-- Spacer for fixed header -->
  <div class="h-16"></div>
</template>

<style scoped>
/* Custom animations */
.router-link-active {
  position: relative;
}

.router-link-active:after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 3px;
  background-color: white;
  border-radius: 3px;
}

/* Smooth transitions for dropdown */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Mobile menu transition */
.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: all 0.3s ease;
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
