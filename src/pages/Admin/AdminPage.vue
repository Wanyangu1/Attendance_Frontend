<script setup>
import { ref, computed, onMounted } from 'vue'
import axiosInstance from '@/axiosconfig/axiosInstance'
import * as XLSX from 'xlsx'
import TheNavbar from '@/components/TheNavbar.vue'
import TheFooter from '@/components/TheFooter.vue'

// State
const loading = ref(false)
const records = ref([])
const summary = ref({
  totalEmployees: 0,
  currentlyWorking: 0,
  lateArrivals: 0,
  avgHours: 0,
})
const departments = ref([])
const dateRange = ref('week')
const startDate = ref('')
const endDate = ref('')
const selectedDepartment = ref('')
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

// Computed
const filteredRecords = computed(() => {
  let filtered = [...records.value]
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (r) =>
        r.employee.name.toLowerCase().includes(query) ||
        r.employee.email.toLowerCase().includes(query),
    )
  }
  if (selectedDepartment.value) {
    filtered = filtered.filter((r) => r.employee.department === selectedDepartment.value)
  }
  return filtered
})

const totalPages = computed(() => Math.ceil(filteredRecords.value.length / pageSize.value))

const visiblePages = computed(() => {
  const range = 2
  const start = Math.max(1, currentPage.value - range)
  const end = Math.min(totalPages.value, currentPage.value + range)
  const pages = []
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

// const paginatedRecords = computed(() => {
//   const start = (currentPage.value - 1) * pageSize.value
//   const end = start + pageSize.value
//   return filteredRecords.value.slice(start, end)
// })

// Methods
function formatHours(hours) {
  if (isNaN(hours) || hours === 0) return '0h 0m'
  const hrs = Math.floor(hours)
  const mins = Math.round((hours % 1) * 60)
  return `${hrs}h ${mins}m`
}

function formatDate(dateStr) {
  if (!dateStr) return '--/--/----'
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '--/--/----'
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return '--/--/----'
  }
}

function formatTime(timeStr) {
  return timeStr || '--:-- --'
}

async function fetchRecords() {
  loading.value = true
  try {
    let sDate, eDate
    const today = new Date()

    switch (dateRange.value) {
      case 'today':
        sDate = today.toISOString().split('T')[0]
        eDate = sDate
        break
      case 'week': {
        const day = today.getDay()
        const diff = today.getDate() - day + (day === 0 ? -6 : 1)
        sDate = new Date(today.setDate(diff)).toISOString().split('T')[0]
        eDate = new Date().toISOString().split('T')[0]
        break
      }
      case 'biweekly': {
        const date = today.getDate()
        if (date < 15) {
          sDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
          eDate = new Date(today.getFullYear(), today.getMonth(), 14).toISOString().split('T')[0]
        } else {
          sDate = new Date(today.getFullYear(), today.getMonth(), 15).toISOString().split('T')[0]
          eDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]
        }
        break
      }
      case 'month':
        sDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
        eDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]
        break
      case 'custom':
        sDate = startDate.value
        eDate = endDate.value
        break
    }

    const response = await axiosInstance.get('/api/admin/time-records', {
      params: { start_date: sDate, end_date: eDate },
    })

    records.value = response.data.records
    summary.value = response.data.summary
    departments.value = response.data.departments
  } catch (error) {
    console.error('Error fetching records:', error)
  } finally {
    loading.value = false
  }
}

function exportToExcel() {
  const data = filteredRecords.value.map((record) => ({
    'Employee Name': record.employee.name,
    Department: record.employee.department,
    Date: formatDate(record.date),
    'Check In': formatTime(record.check_in),
    'Check Out': formatTime(record.check_out),
    'Hours Worked': formatHours(record.hours_worked),
    Status: record.status,
    'Biweekly Hours': formatHours(record.biweekly_hours),
    Late: record.late ? 'Yes' : 'No',
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Time Records')

  const date = new Date().toISOString().split('T')[0]
  XLSX.writeFile(wb, `employee_time_records_${date}.xlsx`)
}

// Lifecycle
onMounted(() => {
  const today = new Date()
  endDate.value = today.toISOString().split('T')[0]
  const weekAgo = new Date()
  weekAgo.setDate(today.getDate() - 7)
  startDate.value = weekAgo.toISOString().split('T')[0]
  fetchRecords()
})
</script>
<template>
  <div class="min-h-screen bg-gray-50">
    <TheNavbar />

    <!-- Loading overlay -->
    <div
      v-if="loading"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>

    <main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Employee Time Records</h1>
        <p class="mt-2 text-gray-600">View and manage all employee attendance data</p>
      </div>

      <!-- Filters -->
      <div class="bg-white shadow rounded-lg p-6 mb-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select v-model="dateRange" class="w-full rounded-md border-gray-300 shadow-sm">
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="biweekly">Current Pay Period</option>
              <option value="month">This Month</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div v-if="dateRange === 'custom'">
            <label class="block text-sm font-medium text-gray-700 mb-1">From</label>
            <input
              type="date"
              v-model="startDate"
              class="w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div v-if="dateRange === 'custom'">
            <label class="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input
              type="date"
              v-model="endDate"
              class="w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              v-model="selectedDepartment"
              class="w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="">All Departments</option>
              <option v-for="dept in departments" :key="dept" :value="dept">{{ dept }}</option>
            </select>
          </div>
        </div>

        <div class="mt-4 flex justify-end">
          <button
            @click="fetchRecords"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Apply Filters
          </button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white shadow rounded-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Total Employees</p>
              <p class="text-2xl font-bold text-gray-900">{{ summary.totalEmployees }}</p>
            </div>
            <div class="bg-blue-100 p-3 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white shadow rounded-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Currently Working</p>
              <p class="text-2xl font-bold text-gray-900">{{ summary.currentlyWorking }}</p>
            </div>
            <div class="bg-green-100 p-3 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white shadow rounded-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Late Arrivals Today</p>
              <p class="text-2xl font-bold text-gray-900">{{ summary.lateArrivals }}</p>
            </div>
            <div class="bg-yellow-100 p-3 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white shadow rounded-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Avg Hours This Period</p>
              <p class="text-2xl font-bold text-gray-900">{{ formatHours(summary.avgHours) }}</p>
            </div>
            <div class="bg-purple-100 p-3 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6 text-purple-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Table -->
      <div class="bg-white shadow rounded-lg overflow-hidden mb-8">
        <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-medium text-gray-900">Employee Time Records</h2>
            <div class="flex items-center space-x-4">
              <button
                @click="exportToExcel"
                class="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export
              </button>
              <div class="relative">
                <input
                  type="text"
                  v-model="searchQuery"
                  placeholder="Search employees..."
                  class="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <div class="absolute left-3 top-2.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Employee
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Department
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Check In
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Check Out
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Hours Worked
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Biweekly Progress
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="record in filteredRecords" :key="record.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div
                        class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold"
                      >
                        {{ record.employee.name.charAt(0).toUpperCase() }}
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">
                        {{ record.employee.name }}
                      </div>
                      <div class="text-sm text-gray-500">{{ record.employee.email }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ record.employee.department }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(record.date) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div class="flex items-center">
                    {{ formatTime(record.check_in) }}
                    <span
                      v-if="record.late"
                      class="ml-2 px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800"
                    >
                      Late
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatTime(record.check_out) || '--:-- --' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatHours(record.hours_worked) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="{
                      'px-2 inline-flex text-xs leading-5 font-semibold rounded-full': true,
                      'bg-green-100 text-green-800': record.status === 'Completed',
                      'bg-yellow-100 text-yellow-800': record.status === 'In Progress',
                      'bg-red-100 text-red-800': record.status === 'Missing',
                    }"
                  >
                    {{ record.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="w-24 mr-2">
                      <div class="w-full bg-gray-200 rounded-full h-2">
                        <div
                          class="bg-blue-600 h-2 rounded-full"
                          :style="{
                            width: `${Math.min(100, (record.biweekly_hours / 80) * 100)}%`,
                          }"
                        ></div>
                      </div>
                    </div>
                    <span class="text-xs text-gray-500"
                      >{{ formatHours(record.biweekly_hours) }} / 80h</span
                    >
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div class="flex-1 flex justify-between sm:hidden">
            <button
              @click="currentPage = Math.max(1, currentPage - 1)"
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              @click="currentPage = Math.min(totalPages, currentPage + 1)"
              class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Next
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Showing <span class="font-medium">{{ (currentPage - 1) * pageSize + 1 }}</span> to
                <span class="font-medium">{{
                  Math.min(currentPage * pageSize, filteredRecords.length)
                }}</span>
                of <span class="font-medium">{{ filteredRecords.length }}</span> results
              </p>
            </div>
            <div>
              <nav
                class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  @click="currentPage = Math.max(1, currentPage - 1)"
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span class="sr-only">Previous</span>
                  <svg
                    class="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>
                <button
                  v-for="page in visiblePages"
                  :key="page"
                  @click="currentPage = page"
                  :class="{
                    'relative inline-flex items-center px-4 py-2 border text-sm font-medium': true,
                    'z-10 bg-blue-50 border-blue-500 text-blue-600': currentPage === page,
                    'bg-white border-gray-300 text-gray-500 hover:bg-gray-50': currentPage !== page,
                  }"
                >
                  {{ page }}
                </button>
                <button
                  @click="currentPage = Math.min(totalPages, currentPage + 1)"
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span class="sr-only">Next</span>
                  <svg
                    class="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </main>

    <TheFooter />
  </div>
</template>
<style scoped>
/* Custom styling for the table */
.table-container {
  max-height: calc(100vh - 300px);
  overflow-y: auto;
}

/* Sticky header */
thead {
  position: sticky;
  top: 0;
  background-color: #f9fafb;
  z-index: 10;
}

/* Hover effects */
tr:hover {
  background-color: #f8fafc;
}

/* Status badges */

/* Transition effects */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
</style>
