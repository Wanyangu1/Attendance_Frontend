<script setup>
import { ref, computed, onMounted } from 'vue'
import TheFooter from '@/components/TheFooter.vue'
import TheNavbar from '@/components/TheNavbar.vue'
import axiosInstance from '@/axiosconfig/axiosInstance'

// State
const searchQuery = ref('')
const statusFilter = ref('active')
const dateRange = ref({
  start: '',
  end: ''
})
const showEditModal = ref(false)
const editedClient = ref(null)
const activeFilters = ref([])
const clients = ref([])
const isLoading = ref(false)
const error = ref(null)
const currentUser = ref(null)

// Fetch current user profile
const fetchProfile = async () => {
  try {
    const response = await axiosInstance.get('/api/profile/')
    currentUser.value = response.data
    console.log('Current user profile:', currentUser.value) // Debug log
    return response.data
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to fetch profile'
    console.error('Error fetching profile:', err)
    throw err
  }
}

// Fetch clients assigned to current user
const fetchClients = async () => {
  try {
    isLoading.value = true
    error.value = null

    // Get current user profile
    const user = await fetchProfile()

    // Fetch all clients
    const response = await axiosInstance.get('/api/clients/')
    console.log('All clients:', response.data)

    // Filter clients where client.user matches user.id
    clients.value = response.data.filter(client => {
      console.log(`Checking client ${client.id}: client.user=${client.user} vs profile.id=${user.id}`)
      return client.user === user.id
    })

    console.log('Filtered clients:', clients.value)
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to fetch clients'
    console.error('Error fetching clients:', err)
  } finally {
    isLoading.value = false
  }
}

const updateClient = async (clientData) => {
  try {
    isLoading.value = true
    error.value = null

    const user = await fetchProfile()
    if (clientData.user !== user.id) {
      throw new Error('Unauthorized: You can only update your own clients')
    }

    const response = await axiosInstance.patch(`/api/clients/${clientData.id}/`, clientData)
    const updatedClient = response.data

    // Update local state
    const index = clients.value.findIndex(c => c.id === updatedClient.id)
    if (index !== -1) {
      clients.value[index] = updatedClient
    }
    return updatedClient
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to update client'
    console.error('Error updating client:', err)
    throw err
  } finally {
    isLoading.value = false
  }
}

// Computed properties
const filteredClients = computed(() => {
  let filtered = clients.value

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(client =>
    (client.lastName?.toLowerCase().includes(query) ||
      client.firstName?.toLowerCase().includes(query) ||
      client.clientId?.toLowerCase().includes(query) ||
      client.phone?.toLowerCase().includes(query))
    )
  }

  // Status filter
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(client => client.status === statusFilter.value)
  }

  // Date range filter
  if (dateRange.value.start && dateRange.value.end) {
    filtered = filtered.filter(client => {
      const dob = new Date(client.dob)
      const startDate = new Date(dateRange.value.start)
      const endDate = new Date(dateRange.value.end)
      return dob >= startDate && dob <= endDate
    })
  }

  updateActiveFilters()
  return filtered
})

const updateActiveFilters = () => {
  activeFilters.value = []
  if (searchQuery.value) activeFilters.value.push(`Search: "${searchQuery.value}"`)
  if (statusFilter.value !== 'all') activeFilters.value.push(`Status: ${statusFilter.value}`)
  if (dateRange.value.start && dateRange.value.end) {
    activeFilters.value.push(`DOB: ${formatDisplayDate(dateRange.value.start)} to ${formatDisplayDate(dateRange.value.end)}`)
  }
}

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  return `${month}/${day}/${year}`
}

// Methods
const openEditModal = (client) => {
  editedClient.value = { ...client }
  showEditModal.value = true
}

const saveClient = async () => {
  try {
    await updateClient(editedClient.value)
    showEditModal.value = false
  } catch {
    // Error handling done in updateClient
  }
}

const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = 'active'
  dateRange.value = { start: '', end: '' }
}

const removeFilter = (filterIndex) => {
  const filter = activeFilters.value[filterIndex]
  if (filter.includes('Search')) {
    searchQuery.value = ''
  } else if (filter.includes('Status')) {
    statusFilter.value = 'all'
  } else if (filter.includes('DOB')) {
    dateRange.value = { start: '', end: '' }
  }
}

// Lifecycle
onMounted(() => {
  fetchClients()
})
</script>

<template>
  <TheNavbar />
  <div class="min-h-screen bg-gray-50 p-6">
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800">My Client List</h1>
      <p v-if="currentUser" class="text-sm text-gray-600 mt-1">
        Logged in as: {{ currentUser.name }} (ID: {{ currentUser.id }})
      </p>
    </div>

    <!-- Error message -->
    <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
      role="alert">
      <strong class="font-bold">Error!</strong>
      <span class="block sm:inline">{{ error }}</span>
      <button @click="error = null" class="absolute top-0 right-0 px-4 py-3">
        <svg class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Loading indicator -->
    <div v-if="isLoading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
    </div>

    <!-- Filters Section -->
    <div v-if="!isLoading" class="bg-white rounded-lg shadow p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Search by Name/ID -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Search by Client Last Name, ID or Phone</label>
          <div class="relative rounded-md shadow-sm">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                fill="currentColor">
                <path fill-rule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clip-rule="evenodd" />
              </svg>
            </div>
            <input type="text" v-model="searchQuery"
              class="focus:ring-teal-500 focus:border-teal-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
              placeholder="Search clients...">
          </div>
        </div>

        <!-- Date Range Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Search by DOB range</label>
          <div class="grid grid-cols-2 gap-2">
            <input type="date" v-model="dateRange.start"
              class="focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 rounded-md border p-2"
              placeholder="Start date">
            <input type="date" v-model="dateRange.end"
              class="focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 rounded-md border p-2"
              placeholder="End date">
          </div>
        </div>

        <!-- Status Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Select Status</label>
          <select v-model="statusFilter"
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md border">
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      <!-- Active Filters -->
      <div class="mt-4" v-if="activeFilters.length > 0">
        <div class="flex items-center">
          <span class="text-sm font-medium text-gray-700 mr-2">Active Filters:</span>
          <div class="flex flex-wrap gap-2">
            <span v-for="(filter, index) in activeFilters" :key="index"
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
              {{ filter }}
              <button @click="removeFilter(index)" type="button"
                class="ml-1.5 inline-flex text-teal-800 hover:text-teal-900">
                <span class="sr-only">Remove filter</span>
                <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          </div>
          <button @click="clearFilters" class="ml-2 text-sm text-teal-600 hover:text-teal-800">
            Clear all
          </button>
        </div>
      </div>
      <div v-else class="mt-4">
        <span class="text-sm font-medium text-gray-700">Active Filters: None</span>
      </div>
    </div>

    <!-- Results Summary -->
    <div v-if="!isLoading" class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-semibold text-gray-800">Client Records</h2>
      <p class="text-sm text-gray-600">Showing {{ filteredClients.length }} of {{ clients.length }} clients</p>
    </div>

    <!-- Clients Table -->
    <div v-if="!isLoading" class="bg-white shadow overflow-hidden rounded-lg">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-teal-600">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                View/Edit</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Client
                Last</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Client
                First</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Client
                ID</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">DOB
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Location</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Bill
                Type</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Phone
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Parent/Guardian</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="client in filteredClients" :key="client.id" class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <button @click="openEditModal(client)" class="text-teal-600 hover:text-teal-900">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ client.lastName }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ client.firstName }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ client.clientId }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ client.dob }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ client.location }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ client.billType }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ client.phone }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ client.guardian }}</td>
            </tr>
            <tr v-if="filteredClients.length === 0">
              <td colspan="9" class="px-6 py-4 text-center text-sm text-gray-500">
                No clients found matching your criteria
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Edit Client Modal -->
    <div v-if="showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full">
        <div class="p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Edit Client: {{ editedClient.firstName }} {{
            editedClient.lastName }}</h3>

          <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            role="alert">
            <strong class="font-bold">Error updating client:</strong>
            <span class="block sm:inline">{{ error }}</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input v-model="editedClient.lastName" type="text"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md border">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input v-model="editedClient.firstName" type="text"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md border">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
              <input v-model="editedClient.clientId" type="text"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md border">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input v-model="editedClient.dob" type="text"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md border">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input v-model="editedClient.location" type="text"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md border">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Bill Type</label>
              <select v-model="editedClient.billType"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md border">
                <option>yearly</option>
                <option>monthly</option>
                <option>quarterly</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input v-model="editedClient.phone" type="tel"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md border">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Parent/Guardian</label>
              <input v-model="editedClient.guardian" type="text"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md border">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select v-model="editedClient.status"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md border">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div class="mt-6 flex justify-end space-x-3">
            <button @click="showEditModal = false; error = null"
              class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors">
              Cancel
            </button>
            <button @click="saveClient" :disabled="isLoading"
              class="px-4 py-2 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <span v-if="isLoading">Saving...</span>
              <span v-else>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <TheFooter />
</template>
