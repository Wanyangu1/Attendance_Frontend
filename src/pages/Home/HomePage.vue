<script setup>
import { ref, computed, onMounted } from 'vue'
import axiosInstance from '@/axiosconfig/axiosInstance'
import TheNavbar from '@/components/TheNavbar.vue'
import TheFooter from '@/components/TheFooter.vue'

// Employee data
const employee = ref({
  name: '',
  email: '',
  phone: '',
  address: {
    street: '2051 W. Guadalupe #A',
    street2: '',
    city: 'Mesa',
    state: 'AZ',
    zip: '85202'
  },
  employment: {
    manager: 'Kim Warner',
    payPeriodStart: '',
    payPeriodEnd: ''
  }
})

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
  type: 'success' // 'success' or 'error'
})

// Computed properties
const currentDate = computed(() => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const biweeklyHours = computed(() => {
  return recentDays.value.reduce((total, day) => total + day.hours, 0)
})

const todayHours = computed(() => {
  if (!todayCheckIn.value) return 0
  if (todayCheckOut.value) {
    // Calculate actual hours if checked out
    const checkInDate = new Date(currentSessionStart.value)
    const checkOutDate = new Date(todayCheckOut.value)
    const diff = checkOutDate - checkInDate
    return diff / (1000 * 60 * 60) // Convert ms to hours
  }
  // Calculate current session hours if still checked in
  const now = new Date()
  const diff = now - new Date(currentSessionStart.value)
  return diff / (1000 * 60 * 60)
})

const currentSessionHours = computed(() => {
  if (!todayCheckIn.value || todayCheckOut.value) return 0
  const now = new Date()
  const diff = now - new Date(currentSessionStart.value)
  return diff / (1000 * 60 * 60) // Convert ms to hours
})

const formattedPhone = computed(() => {
  if (!employee.value.phone) return ''
  const cleaned = ('' + employee.value.phone).replace(/\D/g, '')
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : employee.value.phone
})

// Methods
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
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
  } catch {
    return '--/--/----'
  }
}

const formatTime = (timeStr) => {
  return timeStr || '--:-- --';
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
      const fullDate = record.date; // e.g., "05/06/2025"
      const day = new Date(fullDate).toLocaleDateString('en-US', { weekday: 'long' })
      return {
        id: record.id,
        date: formatDate(fullDate),
        day,
        checkIn: record.check_in || '--:-- --',
        checkOut: record.check_out || null,
        hours: parseFloat(record.hours_worked) || 0,
        status: record.check_out ? 'Completed' : 'In Progress'
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

// Initialize
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
    <!-- Loading overlay -->
    <div v-if="loading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>

    <!-- Notification -->
    <div v-if="notification.show" class="fixed top-4 right-4 z-50">
      <div :class="{
        'flex items-center p-4 rounded-lg shadow-lg': true,
        'bg-green-100 text-green-800 border border-green-200': notification.type === 'success',
        'bg-red-100 text-red-800 border border-red-200': notification.type === 'error'
      }">
        <svg v-if="notification.type === 'success'" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none"
          viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ notification.message }}</span>
      </div>
    </div>

    <!-- Error message -->
    <div v-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
      <p>{{ error }}</p>
    </div>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <!-- Employee Information Section -->
      <div class="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-medium text-gray-900">Employee Information</h2>
        </div>
        <div class="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-4">
            <div class="grid grid-cols-3 gap-4">
              <p class="text-sm font-medium text-gray-500">Street Address</p>
              <p class="col-span-2 text-sm">{{ employee.address.street }}</p>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <p class="text-sm font-medium text-gray-500">Address 2</p>
              <p class="col-span-2 text-sm text-gray-400">
                {{ employee.address.street2 || '-' }}
              </p>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <p class="text-sm font-medium text-gray-500">City, ST ZIP Code</p>
              <p class="col-span-2 text-sm">
                {{ employee.address.city }}, {{ employee.address.state }} {{ employee.address.zip }}
              </p>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <p class="text-sm font-medium text-gray-500">Employee</p>
              <p class="col-span-2 text-sm">{{ employee.name }}</p>
            </div>
          </div>
          <div class="space-y-4">
            <div class="grid grid-cols-3 gap-4">
              <p class="text-sm font-medium text-gray-500">Pay period start date</p>
              <p class="col-span-2 text-sm">{{ employee.employment.payPeriodStart || '--/--/----' }}</p>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <p class="text-sm font-medium text-gray-500">Pay period end date</p>
              <p class="col-span-2 text-sm">{{ employee.employment.payPeriodEnd || '--/--/----' }}</p>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <p class="text-sm font-medium text-gray-500">Manager</p>
              <p class="col-span-2 text-sm">{{ employee.employment.manager }}</p>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <p class="text-sm font-medium text-gray-500">Employee phone</p>
              <p class="col-span-2 text-sm">{{ formattedPhone }}</p>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <p class="text-sm font-medium text-gray-500">Employee e-mail</p>
              <p class="col-span-2 text-sm">{{ employee.email }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Current Status Section -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <!-- Current Pay Period Hours -->
        <div class="bg-white shadow rounded-lg overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-medium text-gray-900">Current Pay Period</h2>
          </div>
          <div class="px-6 py-4">
            <div class="flex items-center justify-between">
              <p class="text-sm font-medium text-gray-500">Hours Worked</p>
              <p class="text-3xl font-bold text-blue-600">{{ formatHours(biweeklyHours) }}</p>
            </div>
            <div class="mt-4">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-medium text-gray-500">Progress to 80 hours</span>
                <span class="text-xs font-medium text-gray-500">{{ Math.min(100, Math.round((biweeklyHours / 80) * 100))
                }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-blue-600 h-2 rounded-full"
                  :style="{ width: `${Math.min(100, (biweeklyHours / 80) * 100)}%` }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Today's Hours -->
        <div class="bg-white shadow rounded-lg overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-medium text-gray-900">Today's Status</h2>
          </div>
          <div class="px-6 py-4">
            <div class="flex items-center justify-between mb-4">
              <p class="text-sm font-medium text-gray-500">Date</p>
              <p class="text-sm font-medium">{{ currentDate }}</p>
            </div>
            <div class="space-y-4">
              <div>
                <p class="text-sm font-medium text-gray-500 mb-1">Check In</p>
                <p class="text-lg font-medium" :class="{ 'text-gray-400': !todayCheckIn }">
                  {{ todayCheckIn || '--:-- --' }}
                </p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500 mb-1">Check Out</p>
                <p class="text-lg font-medium" :class="{ 'text-gray-400': !todayCheckOut }">
                  {{ todayCheckOut || '--:-- --' }}
                </p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500 mb-1">Hours Today</p>
                <p class="text-lg font-medium text-blue-600">{{ formatHours(todayHours) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white shadow rounded-lg overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-medium text-gray-900">Quick Actions</h2>
          </div>
          <div class="px-6 py-4 space-y-4">
            <button @click="checkIn" :disabled="!!todayCheckIn"
              class="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Check In
            </button>
            <button @click="checkOut" :disabled="!todayCheckIn || !!todayCheckOut"
              class="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
              </svg>
              Check Out
            </button>
            <button @click="showTimeHistory"
              class="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Refresh Time History
            </button>
          </div>
        </div>
      </div>

      <!-- Recent Days Worked -->
      <div class="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 class="text-lg font-medium text-gray-900">Recent Days Worked</h2>
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-500">Pay Period:</span>
            <span class="text-sm font-medium">{{ payPeriod.start || '--/--/----' }} - {{ payPeriod.end || '--/--/----'
            }}</span>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Day</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check In</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check Out</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="day in recentDays" :key="day.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ day.date }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ day.day }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ day.checkIn || '--:-- --' }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ day.checkOut || '--:-- --' }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatHours(day.hours) }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="{
                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full': true,
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

      <!-- Current Time Tracking (if checked in) -->
      <div v-if="todayCheckIn && !todayCheckOut"
        class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 animate-pulse">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-medium text-blue-800">Currently Working</h3>
            <p class="text-sm text-blue-600">Checked in at {{ todayCheckIn }}</p>
          </div>
          <div class="text-right">
            <p class="text-sm text-blue-600">Time elapsed today</p>
            <p class="text-3xl font-bold text-blue-800">{{ formatHours(currentSessionHours) }}</p>
          </div>
        </div>
      </div>
    </main>
  </div>
  <TheFooter />
</template>

<style scoped>
/* Animation for check in/out buttons */
button {
  transition: all 0.2s ease;
}

/* Custom styling for the current session tracker */
.current-session {
  background: rgba(59, 130, 246, 0.05);
  border-color: rgba(59, 130, 246, 0.2);
}

/* Responsive table */
@media (max-width: 640px) {
  table {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
}

/* Animation for currently working card */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.9;
  }
}
</style>
