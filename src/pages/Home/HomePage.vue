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
    payPeriodStart: '4/28/2025',
    payPeriodEnd: '5/11/2025'
  }
})

const loading = ref(false)
const error = ref(null)

// Fetch employee profile data
const fetchProfile = async () => {
  try {
    loading.value = true
    error.value = null
    const response = await axiosInstance.get('/api/profile/')
    // Update only the fields we get from API
    employee.value.name = response.data.name || ''
    employee.value.email = response.data.email || ''
    employee.value.phone = response.data.phone || ''
  } catch (err) {
    error.value = 'Failed to load profile data. Please try again later.'
    console.error('Error fetching profile:', err)
    // Fallback to sample data if API fails
    employee.value.name = 'David Irihose'
    employee.value.email = 'davidirihose94@gmail.com'
    employee.value.phone = '520-736-1677'
  } finally {
    loading.value = false
  }
}

// Sample attendance data - in a real app this would come from an API
const recentDays = ref([
  { date: '5/10/2025', day: 'Saturday', checkIn: '8:02 AM', checkOut: '4:35 PM', hours: 8.55, status: 'Completed' },
  { date: '5/9/2025', day: 'Friday', checkIn: '7:58 AM', checkOut: '4:30 PM', hours: 8.53, status: 'Completed' },
  { date: '5/8/2025', day: 'Thursday', checkIn: '8:05 AM', checkOut: '4:40 PM', hours: 8.58, status: 'Completed' },
  { date: '5/7/2025', day: 'Wednesday', checkIn: '8:00 AM', checkOut: '12:30 PM', hours: 4.5, status: 'In Progress' },
  { date: '5/6/2025', day: 'Tuesday', checkIn: '8:15 AM', checkOut: '5:00 PM', hours: 8.75, status: 'Completed' },
  { date: '5/5/2025', day: 'Monday', checkIn: '7:45 AM', checkOut: '4:15 PM', hours: 8.5, status: 'Completed' },
  { date: '5/4/2025', day: 'Sunday', checkIn: null, checkOut: null, hours: 0, status: 'Missing' },
])

const todayCheckIn = ref('8:02 AM')
const todayCheckOut = ref(null)
const currentSessionStart = ref(new Date())

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
    return 8.5 // Sample value - real app would calculate
  }
  return 4.25 // Sample value - real app would calculate
})

const currentSessionHours = computed(() => {
  if (!todayCheckIn.value || todayCheckOut.value) return 0
  const now = new Date()
  const diff = now - currentSessionStart.value
  return diff / (1000 * 60 * 60) // Convert ms to hours
})

const formattedPhone = computed(() => {
  if (!employee.value.phone) return ''
  const cleaned = ('' + employee.value.phone).replace(/\D/g, '')
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : employee.value.phone
})

// Methods
const formatHours = (hours) => {
  const hrs = Math.floor(hours)
  const mins = Math.round((hours % 1) * 60)
  return `${hrs}h ${mins}m`
}

const checkIn = () => {
  const now = new Date()
  todayCheckIn.value = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  currentSessionStart.value = now

  const todayStr = now.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
  if (!recentDays.value.some(day => day.date === todayStr)) {
    recentDays.value.unshift({
      date: todayStr,
      day: now.toLocaleDateString('en-US', { weekday: 'long' }),
      checkIn: todayCheckIn.value,
      checkOut: null,
      hours: 0,
      status: 'In Progress'
    })
  }
}

const checkOut = () => {
  const now = new Date()
  todayCheckOut.value = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  const todayStr = now.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
  const todayIndex = recentDays.value.findIndex(day => day.date === todayStr)
  if (todayIndex !== -1) {
    recentDays.value[todayIndex].checkOut = todayCheckOut.value
    recentDays.value[todayIndex].status = 'Completed'
    recentDays.value[todayIndex].hours = 8.5
  }
}

const showTimeHistory = () => {
  alert('Time history would be shown here in a real application')
}

// Initialize
onMounted(() => {
  fetchProfile()
  setInterval(() => {
    // Force computed properties to update
  }, 1000)
})
</script>


<template>
  <TheNavbar />
  <div class="min-h-screen bg-gray-50">

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <!-- Employee Information Section -->
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
              <p class="col-span-2 text-sm">{{ employee.employment.payPeriodStart }}</p>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <p class="text-sm font-medium text-gray-500">Pay period end date</p>
              <p class="col-span-2 text-sm">{{ employee.employment.payPeriodEnd }}</p>
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
                  :style="{ width: `${Math.min(100, (biweeklyHours / 80)) * 100}%` }"></div>
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
              <div v-if="todayHours > 0">
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
              class="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300 disabled:cursor-not-allowed">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Check In
            </button>
            <button @click="checkOut" :disabled="!todayCheckIn || !!todayCheckOut"
              class="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300 disabled:cursor-not-allowed">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
              </svg>
              Check Out
            </button>
            <button @click="showTimeHistory"
              class="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              View Time History
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
            <span class="text-sm font-medium">4/28/2025 - 5/11/2025</span>
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
              <tr v-for="day in recentDays" :key="day.date">
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
      <div v-if="todayCheckIn && !todayCheckOut" class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
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
</style>
