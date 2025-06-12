<script setup>
import { ref, onMounted } from 'vue'
import TheFooter from '@/components/TheFooter.vue'
import TheNavbar from '@/components/TheNavbar.vue'
import axiosInstance from '@/axiosconfig/axiosInstance'
import * as XLSX from 'xlsx'

const timeSheetData = ref([])
const isLoading = ref(true)
const currentUser = ref(null)
const summary = ref({
  provider: '',
  client: '',
  dateRange: '',
  totalCompletedUnits: 0,
  totalNoShowUnits: 0,
  noShowHomeUnits: 0
})

// Simplified time difference calculation
const calculateHours = (timeIn, timeOut) => {
  if (!timeIn || !timeOut) return 0

  // Convert "HH:MM:SS" to total hours
  const toHours = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours + (minutes / 60)
  }

  const start = toHours(timeIn)
  const end = toHours(timeOut)

  // Calculate difference and round to 2 decimal places
  return Math.round((end - start) * 100) / 100
}

// Export to Excel functionality
const exportToExcel = () => {
  const exportData = timeSheetData.value.map(entry => ({
    'Status': entry.status,
    'Client': entry.client,
    'Service': entry.service,
    'Service Date': entry.serviceDate,
    'Start Time': entry.startTime,
    'End Time': entry.endTime,
    'Provider': entry.provider,
    'Billable Hours': entry.billableUnits
  }))

  const ws = XLSX.utils.json_to_sheet(exportData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Timesheet")
  XLSX.writeFile(wb, `timesheet_${new Date().toISOString().split('T')[0]}.xlsx`)
}

// Fetch logged-in user data
const fetchCurrentUser = async () => {
  try {
    const response = await axiosInstance.get('/api/profile/')
    currentUser.value = response.data
    summary.value.provider = currentUser.value.name // Use just the name field
  } catch (error) {
    console.error('Error fetching user data:', error)
  }
}

// Fetch attendance data and match with clients
const fetchData = async () => {
  try {
    isLoading.value = true
    await fetchCurrentUser()

    // Fetch all data
    const [attendanceRes, clientsRes] = await Promise.all([
      axiosInstance.get('/api/attendance/'),
      axiosInstance.get('/api/clients/')
    ])

    const attendanceData = attendanceRes.data
    const clientsDataRaw = clientsRes.data

    // Filter clients to only those belonging to the current user
    const userClients = clientsDataRaw.filter(client => client.user === currentUser.value.id)

    // Process data - only include attendance for the user's clients
    timeSheetData.value = attendanceData
      .filter(attendance => {
        // Check if this attendance belongs to one of the user's clients
        return userClients.some(client => client.clientId === attendance.client)
      })
      .map(attendance => {
        const client = userClients.find(c => c.clientId === attendance.client)
        const hoursWorked = calculateHours(attendance.time_in, attendance.time_out)
        const clientName = client ? `${client.firstName} ${client.lastName}` : attendance.client

        return {
          status: attendance.time_out ? 'Completed' : 'In Progress',
          client: clientName,
          service: attendance.service,
          serviceDate: attendance.date,
          startTime: attendance.time_in ? formatTime(attendance.time_in) : 'N/A',
          endTime: attendance.time_out ? formatTime(attendance.time_out) : 'N/A',
          provider: summary.value.provider,
          billableUnits: hoursWorked
        }
      })

    // Calculate summary
    updateSummary(attendanceData)

  } catch (error) {
    console.error('Error fetching data:', error)
  } finally {
    isLoading.value = false
  }
}

const updateSummary = (attendanceData) => {
  if (attendanceData.length === 0) return

  const dates = attendanceData.map(a => new Date(a.date))
  const minDate = new Date(Math.min(...dates)).toLocaleDateString()
  const maxDate = new Date(Math.max(...dates)).toLocaleDateString()

  summary.value.dateRange = `${minDate} - ${maxDate}`
  summary.value.totalCompletedUnits = timeSheetData.value
    .filter(entry => entry.status === 'Completed')
    .reduce((sum, entry) => sum + entry.billableUnits, 0)
  summary.value.totalNoShowUnits = timeSheetData.value
    .filter(entry => entry.status !== 'Completed')
    .reduce((sum, entry) => sum + entry.billableUnits, 0)
}

// Format time from "HH:MM:SS" to "HH:MM AM/PM"
const formatTime = (timeString) => {
  if (!timeString) return 'N/A'

  const [hours, minutes] = timeString.split(':')
  const hourNum = parseInt(hours, 10)
  const ampm = hourNum >= 12 ? 'PM' : 'AM'
  const displayHour = hourNum % 12 || 12

  return `${displayHour}:${minutes} ${ampm}`
}

onMounted(fetchData)
</script>

<template>
  <TheNavbar />
  <div class="min-h-screen bg-gray-50 p-6">
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800">Attendance Report / Time Sheet</h1>
    </div>

    <!-- Summary Information -->
    <div class="bg-white rounded-lg shadow p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="space-y-4">
        <div class="flex">
          <span class="w-48 font-medium text-gray-700">Provider</span>
          <span>{{ summary.provider }}</span>
        </div>
        <div class="flex">
          <span class="w-48 font-medium text-gray-700">Client:</span>
          <span>{{ summary.client || 'All Clients' }}</span>
        </div>
        <div class="flex">
          <span class="w-48 font-medium text-gray-700">Dates:</span>
          <span>{{ summary.dateRange || 'Loading...' }}</span>
        </div>
      </div>
      <div class="space-y-4">
        <div class="flex">
          <span class="w-48 font-medium text-gray-700">Total Completed Hours:</span>
          <span>{{ summary.totalCompletedUnits }}</span>
        </div>
        <div class="flex">
          <span class="w-48 font-medium text-gray-700">Total Incomplete Hours:</span>
          <span>{{ summary.totalNoShowUnits }}</span>
        </div>
        <div class="flex">
          <span class="w-48 font-medium text-gray-700">No Show Home Sum of Hours:</span>
          <span>{{ summary.noShowHomeUnits }}</span>
        </div>
      </div>
    </div>

    <!-- Timesheet Table -->
    <div class="bg-white shadow overflow-hidden rounded-lg border border-gray-200">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-teal-600">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-teal-500">
                Status</th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-teal-500">
                Client</th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-teal-500">
                Service</th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-teal-500">
                Service Date</th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-teal-500">
                Start Time</th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-teal-500">
                End Time</th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-teal-500">
                Provider</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Billable Hours
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(entry, index) in timeSheetData" :key="index" class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap text-sm border-r border-gray-100" :class="{
                'text-green-600 font-medium': entry.status === 'Completed',
                'text-yellow-600 font-medium': entry.status === 'In Progress',
                'text-red-600 font-medium': entry.status === 'No Show'
              }">
                {{ entry.status }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-100">
                {{ entry.client }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-100">
                {{ entry.service }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-100">
                {{ entry.serviceDate }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-100">
                {{ entry.startTime }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-100">
                {{ entry.endTime }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-100">
                {{ entry.provider }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ entry.billableUnits }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Loading/Empty State -->
    <div v-if="isLoading" class="bg-white shadow rounded-lg p-8 text-center mt-6">
      <p class="text-gray-500">Loading time sheet records...</p>
    </div>
    <div v-else-if="timeSheetData.length === 0" class="bg-white shadow rounded-lg p-8 text-center mt-6">
      <p class="text-gray-500">No time sheet records found</p>
    </div>

    <!-- Action Buttons -->
    <div class="mt-6 flex justify-end space-x-3">
      <button @click="exportToExcel"
        class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
        Export to Excel
      </button>
      <button class="px-4 py-2 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700">
        Print Timesheet
      </button>
    </div>
  </div>
  <TheFooter />
</template>
