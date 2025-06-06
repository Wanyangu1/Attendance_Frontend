<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import TheFooter from '@/components/TheFooter.vue'
import TheNavbar from '@/components/TheNavbar.vue'

const router = useRouter()

// Get current Arizona date (MST, no DST)
const getArizonaDate = () => {
  const now = new Date()
  const options = { timeZone: 'America/Phoenix', month: '2-digit', day: '2-digit', year: 'numeric' }
  return now.toLocaleDateString('en-US', options)
}

const currentDate = getArizonaDate()

// Form data
const newRecord = ref({
  client: '',
  timeIn: '',
  timeOut: '',
  service: 'DTA - Day Program (Adult) - 1',
  location: 'GUADALUPE DTA',
  date: currentDate,
  oneOnOne: false,
  documentation: false
})

// Location options
const locationOptions = ref([
  'GUADALUPE DTA',
  'GUADALUPE DTT',
  'GUADALUPE SPECIAL DTA'
])

// Service options
const serviceOptions = ref([
  'DTA - Day Program (Adult) - 1',
  'DTA - Day Program (Adult) - 2',
  'DTT - Day Treatment Training',
  'Special DTA - Special Day Program'
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
  timeIn: '',
  timeOut: '',
  service: '',
  location: ''
})

const validateForm = () => {
  let isValid = true
  errors.value = { client: '', timeIn: '', timeOut: '', service: '', location: '' }

  if (!newRecord.value.client.trim()) {
    errors.value.client = 'Client name is required'
    isValid = false
  }

  if (!newRecord.value.timeIn) {
    errors.value.timeIn = 'Time In is required'
    isValid = false
  }

  if (!newRecord.value.timeOut) {
    errors.value.timeOut = 'Time Out is required'
    isValid = false
  } else if (newRecord.value.timeIn && newRecord.value.timeOut) {
    // Convert times to 24-hour format for comparison
    const timeIn = convertTo24Hour(newRecord.value.timeIn)
    const timeOut = convertTo24Hour(newRecord.value.timeOut)

    if (timeOut <= timeIn) {
      errors.value.timeOut = 'Time Out must be after Time In'
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

const submitForm = () => {
  if (validateForm()) {
    // In a real app, you would save to your backend here
    // For now, we'll just navigate back to the attendance log
    router.push({ name: 'Attendance' })

    // Emit an event or use a store to add this record to your attendanceRecords array
    // This would be handled in your parent component or store
  }
}

const cancelForm = () => {
  router.push({ name: 'Attendance' })
}
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

      <!-- Form Section -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="space-y-6">
          <!-- Client Name -->
          <div>
            <label for="client" class="block text-sm font-medium text-gray-700">Client Name</label>
            <input id="client" v-model="newRecord.client" type="text"
              class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md border"
              placeholder="Enter client name">
            <p v-if="errors.client" class="mt-1 text-sm text-red-600">{{ errors.client }}</p>
          </div>

          <!-- Time In/Out -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="timeIn" class="block text-sm font-medium text-gray-700">Time In</label>
              <select id="timeIn" v-model="newRecord.timeIn"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md border">
                <option value="">Select Time In</option>
                <option v-for="time in timeOptions" :key="`in-${time}`" :value="time">{{ time }}</option>
              </select>
              <p v-if="errors.timeIn" class="mt-1 text-sm text-red-600">{{ errors.timeIn }}</p>
            </div>
            <div>
              <label for="timeOut" class="block text-sm font-medium text-gray-700">Time Out</label>
              <select id="timeOut" v-model="newRecord.timeOut"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md border">
                <option value="">Select Time Out</option>
                <option v-for="time in timeOptions" :key="`out-${time}`" :value="time">{{ time }}</option>
              </select>
              <p v-if="errors.timeOut" class="mt-1 text-sm text-red-600">{{ errors.timeOut }}</p>
            </div>
          </div>

          <!-- Service -->
          <div>
            <label for="service" class="block text-sm font-medium text-gray-700">Service</label>
            <select id="service" v-model="newRecord.service"
              class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md border">
              <option v-for="service in serviceOptions" :key="service" :value="service">{{ service }}</option>
            </select>
            <p v-if="errors.service" class="mt-1 text-sm text-red-600">{{ errors.service }}</p>
          </div>

          <!-- Location -->
          <div>
            <label for="location" class="block text-sm font-medium text-gray-700">Location</label>
            <select id="location" v-model="newRecord.location"
              class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md border">
              <option v-for="location in locationOptions" :key="location" :value="location">{{ location }}</option>
            </select>
            <p v-if="errors.location" class="mt-1 text-sm text-red-600">{{ errors.location }}</p>
          </div>

          <!-- Date -->
          <div>
            <label for="date" class="block text-sm font-medium text-gray-700">Date</label>
            <input id="date" v-model="newRecord.date" type="text"
              class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md border bg-gray-100"
              readonly>
          </div>

          <!-- One-on-One Checkbox -->
          <div class="flex items-center">
            <input id="oneOnOne" v-model="newRecord.oneOnOne" type="checkbox"
              class="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded">
            <label for="oneOnOne" class="ml-2 block text-sm text-gray-700">One-on-One Session</label>
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
