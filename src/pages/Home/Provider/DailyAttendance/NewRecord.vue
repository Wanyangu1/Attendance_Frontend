<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import TheFooter from '@/components/TheFooter.vue'
import TheNavbar from '@/components/TheNavbar.vue'
import axiosInstance from '@/axiosconfig/axiosInstance'

const router = useRouter()
const successMessage = ref('')
const clients = ref([])

const fetchClients = async () => {
  try {
    const response = await axiosInstance.get('api/clients/')
    clients.value = response.data
  } catch (error) {
    console.error('Failed to load clients:', error)
  }
}

// Get current Arizona date in MM/DD/YYYY format (MST, no DST)
const getArizonaDate = () => {
  const now = new Date()
  const options = {
    timeZone: 'America/Phoenix',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }
  return now.toLocaleDateString('en-US', options) // Returns MM/DD/YYYY
}

const currentDate = getArizonaDate()

// Form data - matches Django model fields
const newRecord = ref({
  client: '',
  time_in: '',
  time_out: '',
  service: 'DTA1',
  location: 'GUADALUPE_DTA',
  date: currentDate, // Already in MM/DD/YYYY format
  one_on_one: false,
  documentation: false
})

// Location options
const locationOptions = ref([
  { value: 'GUADALUPE_DTA', text: 'GUADALUPE DTA' },
  { value: 'GUADALUPE_DTT', text: 'GUADALUPE DTT' },
  { value: 'GUADALUPE_SPECIAL', text: 'GUADALUPE SPECIAL DTA' }
])

// Service options
const serviceOptions = ref([
  { value: 'DTA1', text: 'DTA - Day Program (Adult) - 1' },
  { value: 'DTA2', text: 'DTA - Day Program (Adult) - 2' },
  { value: 'DTT', text: 'DTT - Day Treatment Training' },
  { value: 'SDTA', text: 'Special DTA - Special Day Program' }
])

// Time options for dropdown
const timeOptions = ref([
  '06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM',
  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM',
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  '06:00 PM'
])

// Form validation
const errors = ref({
  client: '',
  time_in: '',
  time_out: '',
  service: '',
  location: '',
  date: ''
})

const validateForm = () => {
  let isValid = true
  errors.value = {
    client: '',
    time_in: '',
    time_out: '',
    service: '',
    location: '',
    date: ''
  }

  if (!newRecord.value.client.trim()) {
    errors.value.client = 'Client name is required'
    isValid = false
  }

  if (!newRecord.value.time_in) {
    errors.value.time_in = 'Time In is required'
    isValid = false
  }

  if (!newRecord.value.time_out) {
    errors.value.time_out = 'Time Out is required'
    isValid = false
  } else if (newRecord.value.time_in && newRecord.value.time_out) {
    const timeIn = convertTo24Hour(newRecord.value.time_in)
    const timeOut = convertTo24Hour(newRecord.value.time_out)

    if (timeOut <= timeIn) {
      errors.value.time_out = 'Time Out must be after Time In'
      isValid = false
    }
  }

  if (!newRecord.value.service) {
    errors.value.service = 'Service is required'
    isValid = false
  }

  if (!newRecord.value.location) {
    errors.value.location = 'Location is required'
    isValid = false
  }

  // Validate date format (MM/DD/YYYY)
  const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/
  if (!dateRegex.test(newRecord.value.date)) {
    errors.value.date = 'Date must be in MM/DD/YYYY format'
    isValid = false
  }

  return isValid
}

const convertTo24Hour = (timeStr) => {
  const [time, modifier] = timeStr.split(' ')
  let [hours, minutes] = time.split(':')

  if (hours === '12') {
    hours = '00'
  }

  if (modifier === 'PM') {
    hours = parseInt(hours, 10) + 12
  }

  return `${hours}:${minutes}`
}

const submitForm = async () => {
  if (!validateForm()) return

  try {
    const payload = {
      ...newRecord.value,
      time_in: convertTo24Hour(newRecord.value.time_in),
      time_out: convertTo24Hour(newRecord.value.time_out),
      date: newRecord.value.date
    }

    console.log('Submitting payload:', payload)
    await axiosInstance.post('api/attendance/', payload)

    successMessage.value = 'Attendance record created successfully! 🎉'

    setTimeout(() => {
      router.push({ name: 'Attendance' })
    }, 2000) // wait 2 seconds before navigating
  } catch (error) {
    console.error('Error saving record:', error)
    if (error.response && error.response.data) {
      for (const [field, messages] of Object.entries(error.response.data)) {
        errors.value[field] = Array.isArray(messages) ? messages.join(' ') : messages
      }
    }
  }
}

const cancelForm = () => {
  router.push({ name: 'attendance-log' })
}
onMounted(() => {
  fetchClients()
})

</script>

<template>
  <TheNavbar />
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-3xl mx-auto">
      <!-- Page Header -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Add New Attendance Record</h1>
        <p class="text-gray-600 mt-1">{{ currentDate }}</p>
      </div>
      <!-- Success Alert -->
      <div v-if="successMessage"
        class="mb-4 rounded-lg bg-green-100 border border-green-400 text-green-800 px-4 py-3 flex justify-between items-center">
        <span>{{ successMessage }}</span>
        <button @click="successMessage = ''" class="text-green-700 font-bold text-lg">&times;</button>
      </div>


      <!-- Form Section -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="space-y-6">
          <!-- Client Dropdown -->
          <div>
            <label for="client" class="block text-sm font-medium text-gray-700">Client Name</label>
            <select id="client" v-model="newRecord.client"
              class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md border">
              <option value="">Select a client</option>
              <option v-for="client in clients" :key="client.id" :value="client.clientId">
                {{ client.firstName }} {{ client.lastName }}
              </option>
            </select>
            <p v-if="errors.client" class="mt-1 text-sm text-red-600">{{ errors.client }}</p>
          </div>

          <!-- Time In/Out -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="time_in" class="block text-sm font-medium text-gray-700">Time In</label>
              <select id="time_in" v-model="newRecord.time_in"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md border">
                <option value="">Select Time In</option>
                <option v-for="time in timeOptions" :key="`in-${time}`" :value="time">{{ time }}</option>
              </select>
              <p v-if="errors.time_in" class="mt-1 text-sm text-red-600">{{ errors.time_in }}</p>
            </div>
            <div>
              <label for="time_out" class="block text-sm font-medium text-gray-700">Time Out</label>
              <select id="time_out" v-model="newRecord.time_out"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md border">
                <option value="">Select Time Out</option>
                <option v-for="time in timeOptions" :key="`out-${time}`" :value="time">{{ time }}</option>
              </select>
              <p v-if="errors.time_out" class="mt-1 text-sm text-red-600">{{ errors.time_out }}</p>
            </div>
          </div>

          <!-- Service -->
          <div>
            <label for="service" class="block text-sm font-medium text-gray-700">Service</label>
            <select id="service" v-model="newRecord.service"
              class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md border">
              <option v-for="service in serviceOptions" :key="service.value" :value="service.value">
                {{ service.text }}
              </option>
            </select>
            <p v-if="errors.service" class="mt-1 text-sm text-red-600">{{ errors.service }}</p>
          </div>

          <!-- Location -->
          <div>
            <label for="location" class="block text-sm font-medium text-gray-700">Location</label>
            <select id="location" v-model="newRecord.location"
              class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md border">
              <option v-for="location in locationOptions" :key="location.value" :value="location.value">
                {{ location.text }}
              </option>
            </select>
            <p v-if="errors.location" class="mt-1 text-sm text-red-600">{{ errors.location }}</p>
          </div>

          <!-- Date -->
          <div>
            <label for="date" class="block text-sm font-medium text-gray-700">Date</label>
            <input id="date" v-model="newRecord.date" type="text"
              class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md border bg-gray-100"
              readonly>
            <p v-if="errors.date" class="mt-1 text-sm text-red-600">{{ errors.date }}</p>
          </div>

          <!-- One-on-One Checkbox -->
          <div class="flex items-center">
            <input id="one_on_one" v-model="newRecord.one_on_one" type="checkbox"
              class="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded">
            <label for="one_on_one" class="ml-2 block text-sm text-gray-700">One-on-One Session</label>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="mt-8 flex justify-end space-x-3">
          <button @click="cancelForm" type="button"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors">
            Cancel
          </button>
          <button @click="submitForm" type="button"
            class="px-4 py-2 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 transition-colors">
            Save Record
          </button>
        </div>
      </div>
    </div>
  </div>
  <TheFooter />
</template>
