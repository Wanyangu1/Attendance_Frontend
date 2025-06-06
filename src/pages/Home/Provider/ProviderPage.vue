<script setup>
import { ref, computed } from 'vue'
import TheFooter from '@/components/TheFooter.vue'
import TheNavbar from '@/components/TheNavbar.vue'

const searchQuery = ref('')
const statusFilter = ref('active')
const showEditModal = ref(false)
const editedProvider = ref(null)

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
  {
    id: 2,
    lastName: 'Johnson',
    firstName: 'Emily',
    location: 'Downtown Branch',
    email: 'emily.j@example.com',
    phone: '(555) 234-5678',
    payrollId: 'PR12346',
    providerId: 'PV98766',
    status: 'active'
  },
  {
    id: 3,
    lastName: 'Williams',
    firstName: 'Michael',
    location: 'Main Clinic',
    email: 'michael.w@example.com',
    phone: '(555) 345-6789',
    payrollId: 'PR12347',
    providerId: 'PV98767',
    status: 'inactive'
  },
  {
    id: 4,
    lastName: 'Brown',
    firstName: 'Sarah',
    location: 'Westside Clinic',
    email: 'sarah.b@example.com',
    phone: '(555) 456-7890',
    payrollId: 'PR12348',
    providerId: 'PV98768',
    status: 'active'
  },
  {
    id: 5,
    lastName: 'Jones',
    firstName: 'David',
    location: 'Downtown Branch',
    email: 'david.j@example.com',
    phone: '(555) 567-8901',
    payrollId: 'PR12349',
    providerId: 'PV98769',
    status: 'pending'
  },
  {
    id: 6,
    lastName: 'Garcia',
    firstName: 'Maria',
    location: 'Main Clinic',
    email: 'maria.g@example.com',
    phone: '(555) 678-9012',
    payrollId: 'PR12350',
    providerId: 'PV98770',
    status: 'active'
  },
  {
    id: 7,
    lastName: 'Miller',
    firstName: 'James',
    location: 'Westside Clinic',
    email: 'james.m@example.com',
    phone: '(555) 789-0123',
    payrollId: 'PR12351',
    providerId: 'PV98771',
    status: 'inactive'
  },
  {
    id: 8,
    lastName: 'Davis',
    firstName: 'Jennifer',
    location: 'Downtown Branch',
    email: 'jennifer.d@example.com',
    phone: '(555) 890-1234',
    payrollId: 'PR12352',
    providerId: 'PV98772',
    status: 'active'
  },
  {
    id: 9,
    lastName: 'Rodriguez',
    firstName: 'Robert',
    location: 'Main Clinic',
    email: 'robert.r@example.com',
    phone: '(555) 901-2345',
    payrollId: 'PR12353',
    providerId: 'PV98773',
    status: 'pending'
  },
  {
    id: 10,
    lastName: 'Martinez',
    firstName: 'Jessica',
    location: 'Westside Clinic',
    email: 'jessica.m@example.com',
    phone: '(555) 012-3456',
    payrollId: 'PR12354',
    providerId: 'PV98774',
    status: 'active'
  }
])

const openEditModal = (provider) => {
  editedProvider.value = { ...provider }
  showEditModal.value = true
}

const saveProvider = () => {
  const index = providers.value.findIndex(p => p.id === editedProvider.value.id)
  if (index !== -1) {
    providers.value[index] = { ...editedProvider.value }
  }
  showEditModal.value = false
}

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

// Group providers by location for partitioning
const groupedProviders = computed(() => {
  const groups = {}
  filteredProviders.value.forEach(provider => {
    if (!groups[provider.location]) {
      groups[provider.location] = []
    }
    groups[provider.location].push(provider)
  })
  return groups
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

    <!-- Providers Table with Partitioning -->
    <div class="space-y-8">
      <div v-for="[location, locationProviders] in Object.entries(groupedProviders)" :key="location"
        class="bg-white shadow overflow-hidden rounded-lg">
        <!-- Location Header -->
        <div class="bg-teal-100 px-6 py-3 border-b border-teal-200">
          <h3 class="text-lg font-medium text-teal-800">{{ location }}</h3>
        </div>

        <!-- Providers Table -->
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  View/Edit</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last
                  Name</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  First
                  Name</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payroll ID</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider ID</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="provider in locationProviders" :key="provider.id" class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                  <button @click="openEditModal(provider)" class="text-teal-600 hover:text-teal-900 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ provider.lastName }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ provider.firstName }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ provider.email }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ provider.phone }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ provider.payrollId }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ provider.providerId }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="{
                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full': true,
                    'bg-green-100 text-green-800': provider.status === 'active',
                    'bg-red-100 text-red-800': provider.status === 'inactive',
                    'bg-yellow-100 text-yellow-800': provider.status === 'pending'
                  }">
                    {{ provider.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Edit Provider Modal -->
    <div v-if="showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div class="p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Edit Provider: {{ editedProvider.firstName }} {{
            editedProvider.lastName }}</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input v-model="editedProvider.firstName" type="text"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md border">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input v-model="editedProvider.lastName" type="text"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md border">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input v-model="editedProvider.email" type="email"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md border">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input v-model="editedProvider.phone" type="tel"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md border">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <select v-model="editedProvider.location"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md border">
                <option>Main Clinic</option>
                <option>Downtown Branch</option>
                <option>Westside Clinic</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select v-model="editedProvider.status"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md border">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Payroll ID</label>
              <input v-model="editedProvider.payrollId" type="text"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md border">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Provider ID</label>
              <input v-model="editedProvider.providerId" type="text"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md border">
            </div>
          </div>

          <div class="mt-6 flex justify-end space-x-3">
            <button @click="showEditModal = false"
              class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors">
              Cancel
            </button>
            <button @click="saveProvider"
              class="px-4 py-2 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 transition-colors">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <TheFooter />
</template>
