<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import TheFooter from '@/components/TheFooter.vue'
import TheNavbar from '@/components/TheNavbar.vue'
import axiosInstance from '@/axiosconfig/axiosInstance'

const router = useRouter()

// Get current Arizona date (MST, no DST)
const getArizonaDate = () => {
  const now = new Date()
  const options = { timeZone: 'America/Phoenix', month: '2-digit', day: '2-digit', year: 'numeric' }
  return now.toLocaleDateString('en-US', options)
}

const formatDateForInput = (dateStr) => {
  const [month, day, year] = dateStr.split('/')
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

const currentDate = getArizonaDate()
const formattedCurrentDate = formatDateForInput(currentDate)

const locationFilter = ref('GUADALUPE_DTA')
const dateFilter = ref(formattedCurrentDate)
const searchQuery = ref('')
const isLoading = ref(false)

// Details popup state
const showDetailsPopup = ref(false)
const selectedRecord = ref(null)
const detailsForm = ref({
  absent: false,
  oneOnOne: false,
  provider: ''
})

// Track which records have notes
const recordsWithNotes = ref([])
const attendanceRecords = ref([])

// Fetch attendance records from backend
const fetchAttendanceRecords = async () => {
  try {
    isLoading.value = true
    const response = await axiosInstance.get('api/attendance/', {
      params: {
        location: locationFilter.value,
        date: dateFilter.value
      }
    })
    attendanceRecords.value = response.data.map(record => ({
      ...record,
      // Convert 24-hour times back to 12-hour format for display
      timeIn: convertTo12Hour(record.time_in),
      timeOut: convertTo12Hour(record.time_out),
      // Map backend fields to frontend naming
      oneOnOne: record.one_on_one,
      documentation: record.documentation
    }))
  } catch (error) {
    console.error('Error fetching attendance records:', error)
  } finally {
    isLoading.value = false
  }
}

// Convert 24-hour time to 12-hour format
const convertTo12Hour = (timeStr) => {
  if (!timeStr) return ''

  const [hours, minutes] = timeStr.split(':')
  const hourNum = parseInt(hours, 10)
  const suffix = hourNum >= 12 ? 'PM' : 'AM'
  const displayHour = hourNum % 12 || 12

  return `${displayHour}:${minutes} ${suffix}`
}

// Check localStorage for existing notes on component mount
onMounted(() => {
  const savedNotes = JSON.parse(localStorage.getItem('recordsWithNotes') || '[]')
  recordsWithNotes.value = savedNotes
  fetchAttendanceRecords()
})

const checkNotesStatus = (recordId) => {
  return recordsWithNotes.value.includes(recordId)
}

const openDetailsPopup = (record) => {
  selectedRecord.value = record
  detailsForm.value = {
    absent: false,
    oneOnOne: record.oneOnOne || false,
    provider: ''
  }
  showDetailsPopup.value = true
}

const closeDetailsPopup = () => {
  showDetailsPopup.value = false
  selectedRecord.value = null
}

const saveDetails = async () => {
  if (!selectedRecord.value) return

  try {
    const response = await axiosInstance.patch(
      `api/attendance/${selectedRecord.value.id}/`,
      {
        one_on_one: detailsForm.value.oneOnOne
      }
    )
    response.data

    // Update local record
    const recordIndex = attendanceRecords.value.findIndex(r => r.id === selectedRecord.value.id)
    if (recordIndex !== -1) {
      attendanceRecords.value[recordIndex].oneOnOne = detailsForm.value.oneOnOne
    }

    closeDetailsPopup()
  } catch (error) {
    console.error('Error updating record:', error)
  }
}

const navigateToNotes = (record) => {
  router.push({
    name: 'Notes',
    params: { id: record.id },
    state: {
      clientData: {
        name: record.client,
        service: record.service,
        date: record.date,
        timeIn: record.timeIn,
        timeOut: record.timeOut,
        location: record.location
      }
    }
  })
}

const filteredRecords = computed(() => {
  return attendanceRecords.value.filter(record => {
    const matchesLocation = record.location === locationFilter.value
    const matchesDate = record.date === currentDate
    const matchesSearch = searchQuery.value === '' ||
      record.client.toLowerCase().includes(searchQuery.value.toLowerCase())

    return matchesLocation && matchesDate && matchesSearch
  })
})

const deleteRecord = async (id) => {
  try {
    await axiosInstance.delete(`api/attendance/${id}/`)
    attendanceRecords.value = attendanceRecords.value.filter(record => record.id !== id)
    // Remove from recordsWithNotes if present
    recordsWithNotes.value = recordsWithNotes.value.filter(recordId => recordId !== id)
    localStorage.setItem('recordsWithNotes', JSON.stringify(recordsWithNotes.value))
  } catch (error) {
    console.error('Error deleting record:', error)
  }
}

const toggleOneOnOne = async (id) => {
  const record = attendanceRecords.value.find(r => r.id === id)
  if (!record) return

  try {
    const newOneOnOneValue = !record.oneOnOne
    await axiosInstance.patch(
      `api/attendance/${id}/`,
      { one_on_one: newOneOnOneValue }
    )
    record.oneOnOne = newOneOnOneValue
  } catch (error) {
    console.error('Error updating one-on-one status:', error)
  }
}
</script>

<template>
  <TheNavbar />
  <div class="min-h-screen bg-gray-50 p-6">
    <!-- Page Header -->
    <div class="mb-6 flex justify-between items-start">
      <div>
        <h1 class="text-3xl font-bold text-gray-800">Daily Attendance Log</h1>
        <p class="text-gray-600 mt-1">{{ currentDate }}</p>
      </div>
      <div class="flex space-x-2">
        <button
          class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors">
          Daily Payroll Log
        </button>
        <button
          class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors">
          Daily Schedule
        </button>
      </div>
    </div>

    <!-- Search and Filter Section -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Location Filter -->
        <div>
          <label for="location-filter" class="block text-sm font-medium text-gray-700 mb-1">Location:</label>
          <select id="location-filter"
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md border"
            v-model="locationFilter" @change="fetchAttendanceRecords">
            <option value="GUADALUPE_DTA">GUADALUPE DTA</option>
            <option value="GUADALUPE_DTT">GUADALUPE DTT</option>
            <option value="GUADALUPE_SPECIAL">GUADALUPE SPECIAL DTA</option>
          </select>
        </div>

        <!-- Date Filter -->
        <div>
          <label for="date-filter" class="block text-sm font-medium text-gray-700 mb-1">Date:</label>
          <input type="date" id="date-filter"
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md border"
            v-model="dateFilter" @change="fetchAttendanceRecords">
        </div>

        <!-- Client Search -->
        <div>
          <label for="client-search" class="block text-sm font-medium text-gray-700 mb-1">Search Client:</label>
          <div class="relative rounded-md shadow-sm">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                fill="currentColor">
                <path fill-rule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clip-rule="evenodd" />
              </svg>
            </div>
            <input type="text" id="client-search"
              class="focus:ring-teal-500 focus:border-teal-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
              placeholder="Search by client name" v-model="searchQuery">
          </div>
        </div>
      </div>
    </div>

    <!-- Add New Record Button -->
    <div class="mb-4 flex justify-end">
      <button @click="$router.push({ name: 'new-record' })"
        class="px-4 py-2 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 transition-colors flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add New Record
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center p-8">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
    </div>

    <!-- Attendance Table -->
    <div v-else class="bg-white shadow overflow-hidden rounded-lg border border-gray-200">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-teal-600">
            <tr>
              <th scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-teal-500">
                #</th>
              <th scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-teal-500">
                Client</th>
              <th scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-teal-500">
                Time In</th>
              <th scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-teal-500">
                Time Out</th>
              <th scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-teal-500">
                Service</th>
              <th scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-teal-500">
                One-on-One</th>
              <th scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-teal-500">
                Documentation</th>
              <th scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-teal-500">
                Details</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Action
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(record, index) in filteredRecords" :key="record.id" class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-100">{{ index + 1 }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-100">{{
                record.client }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-100">{{ record.timeIn }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-100">{{ record.timeOut
                }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-100">{{ record.service
                }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-100">
                <input type="checkbox" :checked="record.oneOnOne" @change="toggleOneOnOne(record.id)"
                  class="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded">
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-100">
                <button @click="navigateToNotes(record)"
                  class="px-3 py-1 border border-teal-600 text-teal-600 rounded-md text-xs font-medium hover:bg-teal-50 transition-colors flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {{ checkNotesStatus(record.id) ? 'Update' : 'Add' }}
                </button>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-100">
                <button @click="openDetailsPopup(record)"
                  class="px-3 py-1 border border-gray-400 text-gray-600 rounded-md text-xs font-medium hover:bg-gray-50 transition-colors flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Details
                </button>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button @click="deleteRecord(record.id)"
                  class="px-3 py-1 border border-red-600 text-red-600 rounded-md text-xs font-medium hover:bg-red-50 transition-colors flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </td>
            </tr>
            <tr v-if="filteredRecords.length === 0">
              <td colspan="9" class="px-6 py-4 text-center text-sm text-gray-500">No attendance records found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Signature Section -->
    <div class="mt-8 pt-4 border-t border-gray-200">
      <h3 class="text-lg font-medium text-gray-900 mb-2">Signature</h3>
      <div class="w-full border-b-2 border-gray-400 h-10"></div>
    </div>

    <!-- Details Popup Modal -->
    <div v-if="showDetailsPopup" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div class="p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Details for {{ selectedRecord.client }}</h3>

          <div class="space-y-4">
            <div class="flex items-center">
              <input id="absent-checkbox" type="checkbox" v-model="detailsForm.absent"
                class="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded">
              <label for="absent-checkbox" class="ml-2 block text-sm text-gray-700">Absent?</label>
            </div>

            <div class="flex items-center">
              <input id="oneOnOne-checkbox" type="checkbox" v-model="detailsForm.oneOnOne"
                class="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded">
              <label for="oneOnOne-checkbox" class="ml-2 block text-sm text-gray-700">One to One?</label>
            </div>

            <div>
              <label for="provider" class="block text-sm font-medium text-gray-700 mb-1">Provider:</label>
              <input type="text" id="provider" v-model="detailsForm.provider"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md border">
            </div>
          </div>
          <div class="mt-6 flex justify-end space-x-3">
            <button @click="closeDetailsPopup"
              class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors">
              Close
            </button>
            <button @click="saveDetails"
              class="px-4 py-2 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 transition-colors">
              Save Details
            </button>
            <button @click="navigateToNotes(selectedRecord)"
              class="px-4 py-2 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 transition-colors">
              {{ checkNotesStatus(selectedRecord.id) ? 'Update Notes' : 'Add Notes' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <TheFooter />
</template>
