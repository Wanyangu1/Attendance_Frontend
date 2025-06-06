<script setup>
import { ref } from 'vue'
import TheFooter from '@/components/TheFooter.vue'
import TheNavbar from '@/components/TheNavbar.vue'

const timeSheetData = ref([
  {
    status: 'Completed',
    client: 'BRIAN BALLARD',
    dob: '05/15/1985',
    service: 'DTA - Day Program (Adult) - 1',
    serviceDate: '06/05/2025',
    startTime: '08:00 AM',
    endTime: '04:00 PM',
    provider: 'David Irihose',
    cpt: 'H2019',
    notes: 'Regular session',
    payrollUnits: 8,
    billableUnits: 8
  },
  {
    status: 'No Show',
    client: 'MORGAN CAPRETTO',
    dob: '11/22/1990',
    service: 'DTA - Day Program (Adult) - 1',
    serviceDate: '06/06/2025',
    startTime: '08:00 AM',
    endTime: '12:00 PM',
    provider: 'David Irihose',
    cpt: 'H2019',
    notes: 'Client canceled',
    payrollUnits: 0,
    billableUnits: 0
  },
  // Additional records can be added here
])

const summary = ref({
  provider: 'David Irihose',
  client: '',
  dateRange: '05/25/2025 - 06/07/2025',
  totalCompletedUnits: 8,
  totalNoShowUnits: 4,
  noShowHomeUnits: 0
})
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
          <span>{{ summary.dateRange }}</span>
        </div>
      </div>
      <div class="space-y-4">
        <div class="flex">
          <span class="w-48 font-medium text-gray-700">Total Completed Units:</span>
          <span>{{ summary.totalCompletedUnits }}</span>
        </div>
        <div class="flex">
          <span class="w-48 font-medium text-gray-700">Total No Show/Cancel Information:</span>
          <span>{{ summary.totalNoShowUnits }}</span>
        </div>
        <div class="flex">
          <span class="w-48 font-medium text-gray-700">No Show/Cancel Home Sum of Units:</span>
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
              <th scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-teal-500">
                Status</th>
              <th scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-teal-500">
                Client</th>
              <th scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-teal-500">
                DOB</th>
              <th scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-teal-500">
                Service</th>
              <th scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-teal-500">
                Service Date</th>
              <th scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-teal-500">
                Start Time</th>
              <th scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-teal-500">
                End Time</th>
              <th scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-teal-500">
                Provider</th>
              <th scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-teal-500">
                CPT</th>
              <th scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-teal-500">
                Notes</th>
              <th scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-teal-500">
                Payroll Units</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Billable Units</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(entry, index) in timeSheetData" :key="index" class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap text-sm border-r border-gray-100" :class="{
                'text-green-600 font-medium': entry.status === 'Completed',
                'text-red-600 font-medium': entry.status === 'No Show'
              }">
                {{ entry.status }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-100">
                {{ entry.client }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-100">
                {{ entry.dob }}
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
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-100">
                {{ entry.cpt }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-100">
                {{ entry.notes }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-100">
                {{ entry.payrollUnits }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ entry.billableUnits }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="timeSheetData.length === 0" class="bg-white shadow rounded-lg p-8 text-center mt-6">
      <p class="text-gray-500">No time sheet records found for the selected period</p>
    </div>

    <!-- Action Buttons -->
    <div class="mt-6 flex justify-end space-x-3">
      <button
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
