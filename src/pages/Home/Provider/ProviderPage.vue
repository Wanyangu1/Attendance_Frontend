<script setup>
import { ref, computed } from 'vue'
import TheFooter from '@/components/TheFooter.vue'
import TheNavbar from '@/components/TheNavbar.vue'

const searchQuery = ref('')
const statusFilter = ref('active')
const providers = ref([
  {
    id: 1,
    lastName: 'Smith',
    firstName: 'John',
    location: 'Main Clinic',
    email: 'john.smith@example.com',
    phone: '(555) 123-4567',
    payrollId: 'PR12345',
    providerId: 'PV98765',
    status: 'active'
  },
  // More provider objects would be here
])

const filteredProviders = computed(() => {
  let filtered = providers.value;

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(provider =>
      provider.lastName.toLowerCase().includes(query) ||
      provider.firstName.toLowerCase().includes(query) ||
      provider.email.toLowerCase().includes(query) ||
      provider.providerId.toLowerCase().includes(query)
    );
  }

  // Filter by status
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(provider => provider.status === statusFilter.value);
  }

  return filtered;
})
</script>

<template>
  <TheNavbar />
  <div class="min-h-screen bg-gray-50 p-6">
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800">Provider Management</h1>
      <p class="text-gray-600 mt-2">Manage and view all healthcare providers in your system</p>
    </div>

    <!-- Search and Filter Section -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <!-- Search Input -->
        <div class="flex-1">
          <label for="provider-search" class="block text-sm font-medium text-gray-700 mb-1">Search Providers</label>
          <div class="relative rounded-md shadow-sm">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                fill="currentColor">
                <path fill-rule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clip-rule="evenodd" />
              </svg>
            </div>
            <input type="text" id="provider-search"
              class="focus:ring-teal-500 focus:border-teal-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
              placeholder="Search by name, email, or ID" v-model="searchQuery">
          </div>
        </div>

        <!-- Status Filter -->
        <div class="w-full md:w-64">
          <label for="status-filter" class="block text-sm font-medium text-gray-700 mb-1">Select status:</label>
          <select id="status-filter"
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md border"
            v-model="statusFilter">
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Results Summary -->
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-semibold text-gray-800">Provider List</h2>
      <p class="text-sm text-gray-600">Total found: {{ filteredProviders.length }}</p>
    </div>

    <!-- Providers Table -->
    <div class="bg-white shadow overflow-hidden rounded-lg">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-teal-600">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                View/Edit</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Last
                Name</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">First
                Name</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Location</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Email
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Phone
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Payroll ID</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Provider ID</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="provider in filteredProviders" :key="provider.id" class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <button class="text-teal-600 hover:text-teal-900 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ provider.lastName }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ provider.firstName }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ provider.location }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ provider.email }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ provider.phone }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ provider.payrollId }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ provider.providerId }}</td>
            </tr>
            <tr v-if="filteredProviders.length === 0">
              <td colspan="8" class="px-6 py-4 text-center text-sm text-gray-500">No providers found matching your
                criteria</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination would go here -->
  </div>
  <TheFooter />
</template>
