<script setup>
import { ref, computed, onMounted } from 'vue'
import axiosInstance from '@/axiosconfig/axiosInstance'
import TheNavbar from '@/components/TheNavbar.vue'
import TheFooter from '@/components/TheFooter.vue'

// Employee data structure
const employee = ref({
  name: '',
  email: '',
  phone: '',
  address: {
    street: '',
    street2: '',
    city: '',
    state: '',
    zip: ''
  },
  employment: {
    manager: '',
    payPeriodStart: '',
    payPeriodEnd: ''
  },
  settings: {
    id: null,
    street_address: '',
    address2: '',
    city: '',
    state: '',
    zip_code: '',
    manager_name: '',
    user: null
  }
})

// UI State
const loading = ref(false)
const error = ref(null)
const recentDays = ref([])
const todayCheckIn = ref(null)
const todayCheckOut = ref(null)
const currentSessionStart = ref(null)
const payPeriod = ref({ start: '', end: '' })
const notification = ref({
  show: false,
  message: '',
  type: 'success'
})

// Add these computed properties
const ratePerHour = computed(() => {
  return recentDays.value[0]?.rate_per_hour || 0;
});

const formattedRate = computed(() => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(ratePerHour.value);
});

const biweeklyTotalHours = computed(() => {
  return recentDays.value[0]?.biweekly_total_hours || 80; // Default to 80 if not set
});

const biweeklyProgress = computed(() => {
  return Math.min(100, (biweeklyHours.value / biweeklyTotalHours.value) * 100);
});

// Computed Properties
const currentDate = computed(() => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const biweeklyHours = computed(() => {
  return recentDays.value.reduce((total, day) => {
    return total + (day.hours || 0)
  }, 0)
})

const todayHours = computed(() => {
  if (!todayCheckIn.value) return 0
  if (todayCheckOut.value) {
    const checkInDate = new Date(currentSessionStart.value)
    const checkOutDate = new Date(todayCheckOut.value)
    const diff = checkOutDate - checkInDate
    return diff / (1000 * 60 * 60)
  }
  const now = new Date()
  const diff = now - new Date(currentSessionStart.value)
  return diff / (1000 * 60 * 60)
})

const currentSessionHours = computed(() => {
  if (!todayCheckIn.value || todayCheckOut.value) return 0
  const now = new Date()
  const diff = now - new Date(currentSessionStart.value)
  return diff / (1000 * 60 * 60)
})

const formattedPhone = computed(() => {
  if (!employee.value.phone) return ''
  const cleaned = ('' + employee.value.phone).replace(/\D/g, '')
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : employee.value.phone
})

// Helper Methods
const showNotification = (message, type = 'success') => {
  notification.value = {
    show: true,
    message,
    type
  }
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

const formatHours = (hours) => {
  if (isNaN(hours) || hours === 0) return '0h 0m'
  const hrs = Math.floor(hours)
  const mins = Math.round((hours % 1) * 60)
  return `${hrs}h ${mins}m`
}

const formatDate = (dateStr) => {
  if (!dateStr) return '--/--/----'
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '--/--/----'
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    })
  } catch {
    return '--/--/----'
  }
}

const formatTime = (timeStr) => {
  return timeStr || '--:-- --'
}

// Data Fetching Methods
const fetchSettings = async () => {
  try {
    const response = await axiosInstance.get('/api/user/settings/')
    employee.value.settings = response.data

    // Map settings to employee structure
    employee.value.address = {
      street: response.data.street_address || '',
      street2: response.data.address2 || '',
      city: response.data.city || '',
      state: response.data.state || '',
      zip: response.data.zip_code || ''
    }

    if (response.data.manager_name) {
      employee.value.employment.manager = response.data.manager_name
    }
  } catch (err) {
    if (err.response?.status === 404) {
      console.log('No settings found, using default values')
    } else {
      console.error('Error fetching settings:', err)
      showNotification('Failed to load settings', 'error')
    }
  }
}

const fetchEmployeeData = async () => {
  try {
    loading.value = true
    error.value = null

    // Fetch profile data
    const profileResponse = await axiosInstance.get('/api/profile/')
    employee.value.name = profileResponse.data.name || ''
    employee.value.email = profileResponse.data.email || ''
    employee.value.phone = profileResponse.data.phone || ''

    // Fetch settings data
    await fetchSettings()

    // Fetch time records
    await fetchTimeRecords()

    // Fetch today's status
    await fetchTodayStatus()

  } catch (err) {
    error.value = 'Failed to load employee data. Please try again later.'
    console.error('Error fetching employee data:', err)
    showNotification('Failed to load employee data', 'error')
  } finally {
    loading.value = false
  }
}

const fetchTimeRecords = async () => {
  try {
    const response = await axiosInstance.get('api/attendance/history/')
    recentDays.value = response.data.map(record => {
      const fullDate = record.date
      const day = new Date(fullDate).toLocaleDateString('en-US', { weekday: 'long' })
      return {
        id: record.id,
        date: formatDate(fullDate),
        day,
        checkIn: record.check_in || '--:-- --',
        checkOut: record.check_out || null,
        hours: parseFloat(record.hours_worked) || 0,
        status: record.check_out ? 'Completed' : 'In Progress',
        rate_per_hour: parseFloat(record.rate_per_hour) || 0,
        biweekly_total_hours: parseFloat(record.biweekly_total_hours) || 80
      }
    })

    // Calculate pay period based on records
    if (recentDays.value.length > 0) {
      const dates = recentDays.value.map(d => new Date(d.date))
      const minDate = new Date(Math.min(...dates))
      const maxDate = new Date(Math.max(...dates))

      payPeriod.value.start = formatDate(minDate)
      payPeriod.value.end = formatDate(maxDate)
      employee.value.employment.payPeriodStart = payPeriod.value.start
      employee.value.employment.payPeriodEnd = payPeriod.value.end
    }

  } catch (err) {
    console.error('Error fetching time records:', err)
    showNotification('Failed to load time records', 'error')
  }
}

const fetchTodayStatus = async () => {
  try {
    const response = await axiosInstance.get('api/attendance/today/')
    if (response.data.id) {
      todayCheckIn.value = response.data.check_in || '--:-- --'
      currentSessionStart.value = `${response.data.date} ${response.data.check_in}`
      if (response.data.check_out) {
        todayCheckOut.value = response.data.check_out
      }
    }
  } catch (err) {
    console.error('Error fetching today status:', err)
  }
}

// Action Methods
const checkIn = async () => {
  try {
    const response = await axiosInstance.post('api/attendance/checkin/')
    const record = response.data

    todayCheckIn.value = formatTime(record.check_in)
    currentSessionStart.value = record.check_in

    // Update recent days
    const todayStr = formatDate(record.date)
    const existingIndex = recentDays.value.findIndex(day => day.date === todayStr)

    if (existingIndex === -1) {
      recentDays.value.unshift({
        id: record.id,
        date: todayStr,
        day: new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' }),
        checkIn: todayCheckIn.value,
        checkOut: null,
        hours: 0,
        status: 'In Progress'
      })
    }

    showNotification('Checked in successfully')
  } catch (err) {
    const errorMsg = err.response?.data?.error || 'Failed to check in'
    error.value = errorMsg
    showNotification(errorMsg, 'error')
    console.error('Error checking in:', err)
  }
}

const checkOut = async () => {
  try {
    const response = await axiosInstance.post('api/attendance/checkout/')
    const record = response.data

    todayCheckOut.value = formatTime(record.check_out)

    // Update recent days
    const todayStr = formatDate(record.date)
    const todayIndex = recentDays.value.findIndex(day => day.date === todayStr)

    if (todayIndex !== -1) {
      recentDays.value[todayIndex].checkOut = todayCheckOut.value
      recentDays.value[todayIndex].status = 'Completed'
      recentDays.value[todayIndex].hours = parseFloat(record.hours_worked) || 0
    }

    showNotification('Checked out successfully')
  } catch (err) {
    const errorMsg = err.response?.data?.error || 'Failed to check out'
    error.value = errorMsg
    showNotification(errorMsg, 'error')
    console.error('Error checking out:', err)
  }
}

const showTimeHistory = async () => {
  try {
    await fetchTimeRecords()
    showNotification('Time records refreshed')
  } catch (err) {
    showNotification('Failed to refresh time records', 'error')
    console.error('Error refreshing time records:', err)
  }
}

// Initialization
onMounted(() => {
  fetchEmployeeData()

  // Update current session timer every minute
  setInterval(() => {
    // This will force computed properties to update
  }, 60000)
})
</script>
<template>
  <TheNavbar />
  <div class="min-h-screen bg-gray-50">
    <!-- Loading overlay with enhanced animation -->
    <div v-if="loading"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div class="flex flex-col items-center">
        <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
        <p class="text-white font-medium">Loading your dashboard...</p>
      </div>
    </div>

    <!-- Enhanced Notification -->
    <transition enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0" leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="notification.show" class="fixed top-6 right-6 z-50">
        <div :class="{
          'flex items-center p-4 rounded-lg shadow-xl border-l-4': true,
          'bg-green-50 text-green-800 border-green-500': notification.type === 'success',
          'bg-red-50 text-red-800 border-red-500': notification.type === 'error',
          'animate-fade-in-up': notification.show
        }">
          <div :class="{
            'flex-shrink-0': true,
            'text-green-500': notification.type === 'success',
            'text-red-500': notification.type === 'error'
          }">
            <svg v-if="notification.type === 'success'" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-else class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium">{{ notification.message }}</p>
          </div>
        </div>
      </div>
    </transition>

    <!-- Error message with animation -->
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
      <!-- Employee Information Section with enhanced design -->
      <div class="bg-white shadow-xl rounded-xl overflow-hidden mb-8 transition-all duration-300 hover:shadow-2xl">
        <div class="px-6 py-5 bg-gradient-to-r from-blue-200 to-indigo-200">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold text-gray-700">Employee Information</h2>
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Last updated: {{ currentDate }}
            </span>
          </div>
        </div>
        <div class="px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Address Information Card -->
          <div
            class="bg-gray-50 p-5 rounded-lg border border-gray-200 transition-all duration-300 hover:border-blue-300">
            <div class="flex items-center mb-4">
              <div class="bg-blue-100 p-2 rounded-full mr-3">
                <svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 class="text-lg font-medium text-gray-800">Address Information</h3>
            </div>
            <div class="space-y-4">
              <div class="grid grid-cols-3 gap-4">
                <p class="text-sm font-medium text-gray-500">Street Address</p>
                <p class="col-span-2 text-sm text-gray-700">
                  {{ employee.address.street || 'Not specified' }}
                </p>
              </div>
              <div class="grid grid-cols-3 gap-4">
                <p class="text-sm font-medium text-gray-500">Address 2</p>
                <p class="col-span-2 text-sm text-gray-400">
                  {{ employee.address.street2 || '-' }}
                </p>
              </div>
              <div class="grid grid-cols-3 gap-4">
                <p class="text-sm font-medium text-gray-500">City, ST ZIP</p>
                <p class="col-span-2 text-sm text-gray-700">
                  <span v-if="employee.address.city && employee.address.state && employee.address.zip">
                    {{ employee.address.city }}, {{ employee.address.state }} {{ employee.address.zip }}
                  </span>
                  <span v-else class="text-gray-400">Not specified</span>
                </p>
              </div>
            </div>
          </div>

          <!-- Personal Information Card -->
          <div class="space-y-6">
            <div
              class="bg-gray-50 p-5 rounded-lg border border-gray-200 transition-all duration-300 hover:border-blue-300">
              <div class="flex items-center mb-4">
                <div class="bg-indigo-100 p-2 rounded-full mr-3">
                  <svg class="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-800">Personal Information</h3>
              </div>
              <div class="space-y-4">
                <div class="grid grid-cols-3 gap-4">
                  <p class="text-sm font-medium text-gray-500">Employee</p>
                  <p class="col-span-2 text-sm text-gray-700">{{ employee.name || 'Not specified' }}</p>
                </div>
                <div class="grid grid-cols-3 gap-4">
                  <p class="text-sm font-medium text-gray-500">Phone</p>
                  <p class="col-span-2 text-sm text-gray-700">{{ formattedPhone || '-' }}</p>
                </div>
                <div class="grid grid-cols-3 gap-4">
                  <p class="text-sm font-medium text-gray-500">Email</p>
                  <p class="col-span-2 text-sm text-gray-700">{{ employee.email || '-' }}</p>
                </div>
              </div>
            </div>

            <div
              class="bg-gray-50 p-5 rounded-lg border border-gray-200 transition-all duration-300 hover:border-blue-300">
              <div class="flex items-center mb-4">
                <div class="bg-purple-100 p-2 rounded-full mr-3">
                  <svg class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-800">Employment Details</h3>
              </div>
              <div class="space-y-4">
                <div class="grid grid-cols-3 gap-4">
                  <p class="text-sm font-medium text-gray-500">Manager</p>
                  <p class="col-span-2 text-sm text-gray-700">
                    {{ employee.employment.manager || 'Not specified' }}
                  </p>
                </div>
                <div class="grid grid-cols-3 gap-4">
                  <p class="text-sm font-medium text-gray-500">Pay Period</p>
                  <p class="col-span-2 text-sm text-gray-700">
                    <span v-if="employee.employment.payPeriodStart && employee.employment.payPeriodEnd">
                      {{ employee.employment.payPeriodStart }} - {{ employee.employment.payPeriodEnd }}
                    </span>
                    <span v-else class="text-gray-400">Not available</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Cards Section with enhanced animations -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <!-- Current Pay Period Hours Card -->
        <div class="bg-white shadow-lg rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl">
          <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h2 class="text-lg font-semibold text-gray-800">Current Pay Period</h2>
          </div>
          <div class="px-6 py-5">
            <div class="flex items-center justify-between mb-6">
              <div>
                <p class="text-sm font-medium text-gray-500">Hours Worked</p>
                <p class="text-3xl font-bold text-blue-600">{{ formatHours(biweeklyHours) }}</p>
              </div>
              <div class="bg-blue-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>

            <!-- Add Rate Per Hour Display -->
            <div class="mb-4">
              <p class="text-sm font-medium text-gray-500">Rate Per Hour</p>
              <p class="text-xl font-bold text-green-600">{{ formattedRate }}</p>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-medium text-gray-500">
                  Progress to {{ biweeklyTotalHours }} hours
                </span>
                <span class="text-xs font-medium text-gray-500">
                  {{ Math.round(biweeklyProgress) }}%
                </span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2.5">
                <div class="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full"
                  :style="{ width: `${biweeklyProgress}%` }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Today's Hours Card -->
        <div
          class="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <div class="px-6 py-5 bg-gradient-to-r from-green-50 to-teal-50 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-800 flex items-center">
              <svg class="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Today's Status
            </h2>
          </div>
          <div class="px-6 py-5">
            <div class="flex items-center justify-between mb-4">
              <p class="text-sm font-medium text-gray-500">Date</p>
              <p class="text-sm font-medium text-gray-700">{{ currentDate }}</p>
            </div>
            <div class="space-y-5">
              <div>
                <p class="text-sm font-medium text-gray-500 mb-1">Check In</p>
                <p class="text-xl font-medium"
                  :class="{ 'text-gray-400': !todayCheckIn, 'text-green-600': todayCheckIn }">
                  {{ todayCheckIn || '--:-- --' }}
                </p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500 mb-1">Check Out</p>
                <p class="text-xl font-medium"
                  :class="{ 'text-gray-400': !todayCheckOut, 'text-red-600': todayCheckOut }">
                  {{ todayCheckOut || '--:-- --' }}
                </p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500 mb-1">Hours Today</p>
                <p class="text-2xl font-bold text-blue-600">{{ formatHours(todayHours) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions Card -->
        <div
          class="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <div class="px-6 py-5 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-800 flex items-center">
              <svg class="h-5 w-5 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Quick Actions
            </h2>
          </div>
          <div class="px-6 py-5 space-y-4">
            <button @click="checkIn" :disabled="!!todayCheckIn"
              class="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02]">
              <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Check In
            </button>
            <button @click="checkOut" :disabled="!todayCheckIn || !!todayCheckOut"
              class="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02]">
              <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
              </svg>
              Check Out
            </button>
            <button @click="showTimeHistory"
              class="w-full flex items-center justify-center px-6 py-3 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:scale-[1.02]">
              <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Time History
            </button>
          </div>
        </div>
      </div>

      <!-- Recent Days Worked Table with enhanced design -->
      <div id="workedhours"
        class="bg-white rounded-xl shadow-xl overflow-hidden mb-8 transition-all duration-300 hover:shadow-2xl">
        <div class="px-6 py-5 bg-gradient-to-r from-gray-800 to-gray-900 flex justify-between items-center">
          <h2 class="text-lg font-semibold text-white flex items-center">
            <svg class="h-5 w-5 text-blue-300 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Recent Days Worked
          </h2>
          <div class="flex items-center space-x-2 bg-gray-700 px-3 py-1 rounded-full">
            <span class="text-xs text-gray-300">Pay Period:</span>
            <span class="text-xs font-medium text-white">{{ payPeriod.start || '--/--/----' }} - {{ payPeriod.end ||
              '--/--/----' }}</span>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Day
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check In
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check Out
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="day in recentDays" :key="day.id" class="hover:bg-gray-50 transition-colors duration-150">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ day.date }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ day.day }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ day.checkIn || '--:-- --' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ day.checkOut || '--:-- --' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatHours(day.hours) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="{
                    'px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full': true,
                    'bg-green-100 text-green-800': day.status === 'Completed',
                    'bg-yellow-100 text-yellow-800': day.status === 'In Progress',
                    'bg-red-100 text-red-800': day.status === 'Missing'
                  }">
                    {{ day.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Current Time Tracking Banner with enhanced color scheme -->
      <transition enter-active-class="transform transition duration-500 ease-out"
        enter-from-class="-translate-y-10 opacity-0" enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transform transition duration-300 ease-in" leave-from-class="translate-y-0 opacity-100"
        leave-to-class="-translate-y-10 opacity-0">
        <div v-if="todayCheckIn && !todayCheckOut"
          class="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl p-6 mb-8 shadow-lg border border-blue-200">
          <div class="flex flex-col md:flex-row items-center justify-between">
            <div class="flex items-center mb-4 md:mb-0">
              <div class="bg-gradient-to-br from-blue-400 to-indigo-500 p-3 rounded-full mr-4 shadow-md">
                <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-indigo-800">Currently Working</h3>
                <p class="text-sm text-indigo-600 font-medium">Checked in at <span class="text-indigo-800 font-bold">{{
                  todayCheckIn }}</span></p>
              </div>
            </div>
            <div class="text-center md:text-right">
              <p class="text-sm text-indigo-600 font-medium">Time elapsed today</p>
              <p class="text-3xl font-bold text-indigo-700 animate-pulse">{{ formatHours(currentSessionHours) }}</p>
            </div>
          </div>
        </div>
      </transition>
    </main>
  </div>
  <TheFooter />
</template>

<style scoped>
/* Enhanced custom styling with animations */
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

/* Smooth transitions for all interactive elements */
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

/* Enhanced card shadows */
.shadow-md {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.shadow-lg {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.shadow-xl {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.shadow-2xl {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

/* Custom pulse animation */
@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.7;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Hover effects */
.hover\:scale-\[1\.02\]:hover {
  transform: scale(1.02);
}

/* Backdrop blur for modals */
.backdrop-blur-sm {
  backdrop-filter: blur(4px);
}
</style>
