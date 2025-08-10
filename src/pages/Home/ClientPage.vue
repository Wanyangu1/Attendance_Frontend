<script setup>
import { ref, computed, onMounted } from 'vue'
import axiosInstance from '@/axiosconfig/axiosInstance'
import TheNavbar from '@/components/TheNavbar.vue'
import TheFooter from '@/components/TheFooter.vue'

// User data
const user = ref({
  name: '',
  email: '',
})

// Time records data
const timeRecords = ref([])
const members = ref([])
const selectedMember = ref(null)
const currentDate = computed(() => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

// UI State
const loading = ref(false)
const error = ref(null)
const notification = ref({
  show: false,
  message: '',
  type: 'success',
})
const locationLoading = ref(false)

// Computed properties
const todaysRecords = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return timeRecords.value.filter(record => record.date === today)
})

const hasCheckedInToday = computed(() => {
  return todaysRecords.value.some(record => record.check_in && !record.check_out)
})

const currentStatus = computed(() => {
  if (todaysRecords.value.length === 0) return 'Not checked in today'
  const lastRecord = todaysRecords.value[todaysRecords.value.length - 1]
  if (lastRecord.check_out) return `Checked out at ${formatTime(lastRecord.check_out)}`
  return `Checked in at ${formatTime(lastRecord.check_in)}`
})

// Helper Methods
const showNotification = (message, type = 'success') => {
  notification.value = {
    show: true,
    message,
    type,
  }
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

const formatTime = (timeStr) => {
  if (!timeStr) return '--:--'
  // If time is already in HH:MM format, return as is
  if (typeof timeStr === 'string' && timeStr.match(/^\d{2}:\d{2}$/)) {
    return timeStr
  }
  // Try to parse as Date if not in simple format
  try {
    const date = new Date(timeStr)
    if (isNaN(date.getTime())) return '--:--'
    // Format as 24-hour time
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  } catch (e) {
    console.error('Error formatting time:', e)
    return '--:--'
  }
}

const formatHours = (hours) => {
  if (isNaN(hours)) return '0h 0m'
  const hrs = Math.floor(hours)
  const mins = Math.round((hours % 1) * 60)
  return `${hrs}h ${mins}m`
}

// Data Fetching Methods
const fetchUserData = async () => {
  try {
    loading.value = true
    const response = await axiosInstance.get('/api/profile/')
    user.value.name = response.data.name || ''
    user.value.email = response.data.email || ''
  } catch (err) {
    error.value = 'Failed to load user data. Please try again later.'
    console.error('Error fetching user data:', err)
    showNotification('Failed to load user data', 'error')
  } finally {
    loading.value = false
  }
}

const fetchTimeRecords = async () => {
  try {
    loading.value = true
    const response = await axiosInstance.get('/api/member/history/')
    timeRecords.value = response.data
  } catch (err) {
    console.error('Error fetching time records:', err)
    showNotification('Failed to load time records', 'error')
  } finally {
    loading.value = false
  }
}

const fetchMembers = async () => {
  try {
    loading.value = true
    const response = await axiosInstance.get('/api/member/members/')
    members.value = response.data
  } catch (err) {
    console.error('Error fetching members:', err)
    showNotification('Failed to load members list', 'error')
  } finally {
    loading.value = false
  }
}

const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    locationLoading.value = true
    if (!navigator.geolocation) {
      locationLoading.value = false
      reject(new Error('Geolocation is not supported by your browser'))
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          locationLoading.value = false
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          locationLoading.value = false
          reject(error)
        }
      )
    }
  })
}

const checkIn = async () => {
  if (!selectedMember.value) {
    showNotification('Please select a member first', 'error')
    return
  }

  try {
    let location = { latitude: null, longitude: null }
    try {
      location = await getCurrentLocation()
    } catch (geoError) {
      console.warn('Could not get location:', geoError)
      showNotification('Could not get location. Check-in recorded without location.', 'warning')
    }

    const nowIso = new Date().toISOString()

    await axiosInstance.post('/api/member/checkin/', {
      check_in: nowIso,
      date: nowIso.split('T')[0],
      member_id: selectedMember.value,
      latitude: location.latitude,
      longitude: location.longitude
    })

    showNotification('Checked in successfully')
    await fetchTimeRecords()
  } catch (err) {
    const errorMsg = err.response?.data?.error || 'Failed to check in'
    showNotification(errorMsg, 'error')
    console.error('Error checking in:', err)
  }
}

const checkOut = async () => {
  if (!selectedMember.value) {
    showNotification('Please select a member first', 'error')
    return
  }

  try {
    let location = { latitude: null, longitude: null }
    try {
      location = await getCurrentLocation()
    } catch (geoError) {
      console.warn('Could not get location:', geoError)
      showNotification('Could not get location. Check-out recorded without location.', 'warning')
    }

    await axiosInstance.post('/api/member/checkout/', {
      latitude: location.latitude,
      longitude: location.longitude,
      member_id: selectedMember.value
    })

    showNotification('Checked out successfully')
    await fetchTimeRecords()
  } catch (err) {
    const errorMsg = err.response?.data?.error || 'Failed to check out'
    showNotification(errorMsg, 'error')
    console.error('Error checking out:', err)
  }
}

onMounted(() => {
  fetchUserData()
  fetchTimeRecords()
  fetchMembers()
})
</script>

<template>
  <TheNavbar />
  <div class="min-h-screen bg-gray-50">
    <!-- Loading overlay -->
    <div v-if="loading"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div class="flex flex-col items-center">
        <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
        <p class="text-white font-medium">Loading data...</p>
      </div>
    </div>

    <!-- Notification -->
    <transition enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0" leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="notification.show" class="fixed top-6 right-6 z-50">
        <div :class="{
          'flex items-center p-4 rounded-lg shadow-xl border-l-4': true,
          'bg-green-50 text-green-800 border-green-500': notification.type === 'success',
          'bg-red-50 text-red-800 border-red-500': notification.type === 'error',
          'bg-yellow-50 text-yellow-800 border-yellow-500': notification.type === 'warning',
          'animate-fade-in-up': notification.show,
        }">
          <div :class="{
            'flex-shrink-0': true,
            'text-green-500': notification.type === 'success',
            'text-red-500': notification.type === 'error',
            'text-yellow-500': notification.type === 'warning',
          }">
            <svg v-if="notification.type === 'success'" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-else-if="notification.type === 'error'" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <svg v-else class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium">{{ notification.message }}</p>
          </div>
        </div>
      </div>
    </transition>

    <!-- Error message -->
    <transition enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0" enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition ease-in duration-100" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="error"
        class="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 mx-6 mt-6 rounded-r-lg shadow-sm">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm">{{ error }}</p>
          </div>
        </div>
      </div>
    </transition>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <!-- Header Section -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mr-3 text-blue-600" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Member Time Tracking System
          </h1>
          <p class="text-gray-600 mt-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {{ currentDate }}
          </p>
        </div>
        <div class="mt-4 md:mt-0 bg-white rounded-lg shadow-sm p-4">
          <p class="text-sm text-gray-600 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Logged in as: <span class="font-medium text-blue-600 ml-1">{{ user.name }}</span>
          </p>
        </div>
      </div>

      <!-- Member Selection -->
      <div class="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
        <div class="mb-4">
          <label for="member-select" class="block text-sm font-medium text-gray-700 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline mr-2 text-blue-500" fill="none"
              viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Select Member
          </label>
          <select id="member-select" v-model="selectedMember"
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border">
            <option :value="null">-- Select a member --</option>
            <option v-for="member in members" :key="member.id" :value="member.id">
              {{ member.name }} ({{ member.email }})
            </option>
          </select>
        </div>
      </div>

      <!-- Status Card -->
      <div class="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between">
          <div class="flex items-center mb-4 md:mb-0">
            <div class="bg-blue-100 p-3 rounded-full mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-semibold text-gray-800">Current Status</h2>
              <p class="text-gray-600">{{ currentStatus }}</p>
            </div>
          </div>
          <div class="flex flex-col sm:flex-row gap-3">
            <button @click="checkIn" :disabled="hasCheckedInToday || locationLoading || !selectedMember"
              class="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
              <svg v-if="locationLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
              <span v-else class="flex items-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6">
                  </path>
                </svg>
                Check In
              </span>
            </button>
            <button @click="checkOut" :disabled="!hasCheckedInToday || locationLoading || !selectedMember"
              class="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
              <svg v-if="locationLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
              <span v-else class="flex items-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                </svg>
                Check Out
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Today's Time Records -->
      <div class="bg-white rounded-xl shadow-md overflow-hidden mb-8 border border-gray-100">
        <div class="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 flex justify-between items-center">
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white mr-3" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <h2 class="text-lg font-semibold text-white">Today's Time Records</h2>
          </div>
          <span class="px-3 py-1 bg-white bg-opacity-20 text-white text-sm font-medium rounded-full flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {{ todaysRecords.length }} records
          </span>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Date
                  </div>
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Check In
                  </div>
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Check Out
                  </div>
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Hours Worked
                  </div>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="record in todaysRecords" :key="record.id" class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ record.date }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-green-500" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {{ formatTime(record.check_in) }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div class="flex items-center">
                    <svg v-if="record.check_out" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-red-500"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-gray-400" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {{ record.check_out ? formatTime(record.check_out) : '--:--' }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-blue-500" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {{ record.hours_worked ? formatHours(record.hours_worked) : '--' }}
                  </div>
                </td>
              </tr>
              <tr v-if="todaysRecords.length === 0">
                <td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500">
                  <div class="flex flex-col items-center justify-center py-6">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-400 mb-2" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    No time records for today
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Time Records History -->
      <div class="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div class="px-6 py-4 bg-gradient-to-r from-gray-700 to-gray-800 flex justify-between items-center">
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white mr-3" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h2 class="text-lg font-semibold text-white">Time Records History</h2>
          </div>
          <span class="px-3 py-1 bg-white bg-opacity-20 text-white text-sm font-medium rounded-full flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {{ timeRecords.length }} records
          </span>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Date
                  </div>
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Check In
                  </div>
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Check Out
                  </div>
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Hours Worked
                  </div>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="record in timeRecords" :key="record.id" class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ record.date }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-green-500" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {{ formatTime(record.check_in) }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div class="flex items-center">
                    <svg v-if="record.check_out" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-red-500"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-gray-400" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {{ record.check_out ? formatTime(record.check_out) : '--:--' }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-blue-500" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {{ record.hours_worked ? formatHours(record.hours_worked) : '--' }}
                  </div>
                </td>
              </tr>
              <tr v-if="timeRecords.length === 0">
                <td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500">
                  <div class="flex flex-col items-center justify-center py-6">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-400 mb-2" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    No time records found
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
  <TheFooter />
</template>

<style scoped>
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out;
}

button,
a,
input,
select,
textarea,
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

.shadow-md {
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.shadow-lg {
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.shadow-xl {
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.backdrop-blur-sm {
  backdrop-filter: blur(4px);
}
</style>
