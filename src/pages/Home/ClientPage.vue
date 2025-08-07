<script setup>
import { ref, computed, onMounted } from 'vue'
import axiosInstance from '@/axiosconfig/axiosInstance'
import TheNavbar from '@/components/TheNavbar.vue'
import TheFooter from '@/components/TheFooter.vue'
import EmployeeInfo from '@/components/EmployeeInfo.vue'

// Employee and member data
const employee = ref({
  name: '',
  email: '',
  phone: '',
})

// Member data
const members = ref([])
const searchQuery = ref('')
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
const attendanceRecords = ref([])

// Computed properties
const filteredMembers = computed(() => {
  if (!searchQuery.value) return members.value
  return members.value.filter(member =>
    member.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    member.member_id.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const todaysAttendance = computed(() => {
  const today = new Date().toLocaleDateString('en-US')
  return attendanceRecords.value.filter(record =>
    new Date(record.check_in_time).toLocaleDateString('en-US') === today
  )
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
  if (!timeStr) return '--:-- --'
  const date = new Date(timeStr)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatHours = (hours) => {
  if (isNaN(hours) || hours === 0) return '0h 0m'
  const hrs = Math.floor(hours)
  const mins = Math.round((hours % 1) * 60)
  return `${hrs}h ${mins}m`
}

// Data Fetching Methods
const fetchEmployeeData = async () => {
  try {
    loading.value = true
    const profileResponse = await axiosInstance.get('/api/profile/')
    employee.value.name = profileResponse.data.name || ''
    employee.value.email = profileResponse.data.email || ''
    employee.value.phone = profileResponse.data.phone || ''
  } catch (err) {
    error.value = 'Failed to load employee data. Please try again later.'
    console.error('Error fetching employee data:', err)
    showNotification('Failed to load employee data', 'error')
  } finally {
    loading.value = false
  }
}

const fetchMembers = async () => {
  try {
    loading.value = true
    const response = await axiosInstance.get('/api/members/')
    members.value = response.data
  } catch (err) {
    console.error('Error fetching members:', err)
    showNotification('Failed to load members', 'error')
  } finally {
    loading.value = false
  }
}

const fetchAttendanceRecords = async () => {
  try {
    const response = await axiosInstance.get('/api/attendance/')
    attendanceRecords.value = response.data
  } catch (err) {
    console.error('Error fetching attendance records:', err)
    showNotification('Failed to load attendance records', 'error')
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

// Member Actions
const selectMember = (member) => {
  selectedMember.value = member
}

const checkInMember = async () => {
  if (!selectedMember.value) return

  try {
    let location = { latitude: null, longitude: null }
    try {
      location = await getCurrentLocation()
    } catch (geoError) {
      console.warn('Could not get location:', geoError)
      showNotification('Could not get location. Check-in recorded without location.', 'warning')
    }

    await axiosInstance.post('/api/attendance/checkin/', {
      member_id: selectedMember.value.id,
      employee_id: employee.value.id,
      latitude: location.latitude,
      longitude: location.longitude
    })

    showNotification(`${selectedMember.value.name} checked in successfully`)
    await fetchAttendanceRecords()
    selectedMember.value = null
    searchQuery.value = ''
  } catch (err) {
    const errorMsg = err.response?.data?.error || 'Failed to check in member'
    showNotification(errorMsg, 'error')
    console.error('Error checking in member:', err)
  }
}

const checkOutMember = async (record) => {
  try {
    let location = { latitude: null, longitude: null }
    try {
      location = await getCurrentLocation()
    } catch (geoError) {
      console.warn('Could not get location:', geoError)
      showNotification('Could not get location. Check-out recorded without location.', 'warning')
    }

    await axiosInstance.post('/api/attendance/checkout/', {
      attendance_id: record.id,
      latitude: location.latitude,
      longitude: location.longitude
    })

    showNotification(`${record.member_name} checked out successfully`)
    await fetchAttendanceRecords()
  } catch (err) {
    const errorMsg = err.response?.data?.error || 'Failed to check out member'
    showNotification(errorMsg, 'error')
    console.error('Error checking out member:', err)
  }
}

onMounted(() => {
  fetchEmployeeData()
  fetchMembers()
  fetchAttendanceRecords()
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
      <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-800">Member Sign-In System</h1>
            <p class="text-gray-600">{{ currentDate }}</p>
          </div>
          <div class="mt-4 md:mt-0">
            <p class="text-sm text-gray-500">Logged in as: <span class="font-medium text-blue-600">{{ employee.name
                }}</span></p>
          </div>
        </div>

        <!-- Quick Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 mb-8">
          <button @click="fetchMembers"
            class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15">
              </path>
            </svg>
            Refresh Members
          </button>
          <button @click="fetchAttendanceRecords"
            class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Refresh Attendance
          </button>
        </div>

        <!-- Member Search and Check-in -->
        <div class="bg-gray-50 rounded-lg p-6 mb-8">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">Check In Member</h2>

          <div class="mb-4">
            <label for="member-search" class="block text-sm font-medium text-gray-700 mb-1">Search Members</label>
            <div class="relative">
              <input id="member-search" v-model="searchQuery" type="text"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search by name or member ID">
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Member List -->
          <div v-if="filteredMembers.length > 0"
            class="max-h-60 overflow-y-auto border border-gray-200 rounded-lg mb-4">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-100">
                <tr>
                  <th scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member ID
                  </th>
                  <th scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="member in filteredMembers" :key="member.id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ member.member_id }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ member.name }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button @click="selectMember(member)"
                      class="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Select
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="text-center py-4 text-gray-500">
            No members found
          </div>

          <!-- Selected Member Check-in Section -->
          <div v-if="selectedMember" class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div class="flex-1">
                <h3 class="font-medium text-blue-800">Selected Member</h3>
                <p class="text-lg font-semibold">{{ selectedMember.name }}</p>
                <p class="text-sm text-gray-600">ID: {{ selectedMember.member_id }}</p>
              </div>
              <div class="flex gap-2">
                <button @click="checkInMember" :disabled="locationLoading"
                  class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center disabled:opacity-70 disabled:cursor-not-allowed">
                  <svg v-if="locationLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                    </path>
                  </svg>
                  <svg v-else class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {{ locationLoading ? 'Getting location...' : 'Check In' }}
                </button>
                <button @click="selectedMember = null"
                  class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center">
                  <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Today's Attendance Records -->
        <div class="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div class="px-6 py-5 bg-gradient-to-r from-gray-800 to-gray-900 flex justify-between items-center">
            <h2 class="text-lg font-semibold text-white">Today's Attendance</h2>
            <span class="px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-full">
              {{ todaysAttendance.length }} records
            </span>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                  <th scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                  <th scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out
                  </th>
                  <th scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Spent
                  </th>
                  <th scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="record in todaysAttendance" :key="record.id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ record.member_name }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ record.member_id }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatTime(record.check_in_time) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ record.check_out_time ? formatTime(record.check_out_time) : '--:-- --' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ record.hours_worked ? formatHours(record.hours_worked) : '--' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button v-if="!record.check_out_time" @click="checkOutMember(record)" :disabled="locationLoading"
                      class="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center disabled:opacity-70 disabled:cursor-not-allowed">
                      <svg v-if="locationLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                        </circle>
                        <path class="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                        </path>
                      </svg>
                      <svg v-else class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                      </svg>
                      Check Out
                    </button>
                    <span v-else class="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                      Completed
                    </span>
                  </td>
                </tr>
                <tr v-if="todaysAttendance.length === 0">
                  <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">No attendance records for today
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Member Attendance History -->
        <div class="bg-white rounded-xl shadow-lg overflow-hidden">
          <div class="px-6 py-5 bg-gradient-to-r from-gray-800 to-gray-900 flex justify-between items-center">
            <h2 class="text-lg font-semibold text-white">Member Attendance History</h2>
            <span class="px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-full">
              {{ attendanceRecords.length }} records
            </span>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                  <th scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                  <th scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out
                  </th>
                  <th scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Spent
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="record in attendanceRecords" :key="record.id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ new Date(record.check_in_time).toLocaleDateString() }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ record.member_name }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ record.member_id }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatTime(record.check_in_time) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ record.check_out_time ? formatTime(record.check_out_time) : '--:-- --' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ record.hours_worked ? formatHours(record.hours_worked) : '--' }}
                  </td>
                </tr>
                <tr v-if="attendanceRecords.length === 0">
                  <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">No attendance records found</td>
                </tr>
              </tbody>
            </table>
          </div>
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
