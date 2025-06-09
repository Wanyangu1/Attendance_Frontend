<script setup lang="js">
import { ref, onMounted } from 'vue'
import TheFooter from '@/components/TheFooter.vue'
import TheNavbar from '@/components/TheNavbar.vue'
import axiosInstance from '@/axiosconfig/axiosInstance'

// Define profile shape with default values
const profile = ref({
  name: '',
  lastName: '',
  email: '',
  phone: '',
  location: 'Main Clinic',
  payrollId: '',
  providerId: '',
  status: 'active' // possible values: 'active', 'inactive', 'pending'
})

const isLoading = ref(true)
const error = ref(null)
const showEditModal = ref(false)
const locations = ['Main Clinic', 'Downtown Branch', 'Westside Clinic']

const fetchProfile = async () => {
  try {
    isLoading.value = true
    error.value = null

    const response = await axiosInstance.get('/api/profile/')
    profile.value = response.data
  } catch (err) {
    console.error('Error fetching profile:', err)
    error.value = 'Failed to load profile data'
  } finally {
    isLoading.value = false
  }
}

const saveProfile = async () => {
  try {
    isLoading.value = true
    await axiosInstance.put('/api/profile/', profile.value)
    showEditModal.value = false
    alert('Profile updated successfully!')
  } catch (err) {
    console.error('Error saving profile:', err)
    error.value = 'Failed to save profile changes'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchProfile()
})
</script>

<template>
  <TheNavbar />

  <main class="min-h-screen bg-gray-50 p-6">
    <!-- Page Header -->
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800">My Profile</h1>
      <p class="text-gray-600 mt-2">View and manage your provider profile</p>
    </header>

    <!-- Loading state -->
    <div v-if="isLoading" class="text-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
      <p class="mt-2 text-gray-600">Loading profile data...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Profile Display -->
    <section v-else class="bg-white rounded-lg shadow overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-medium text-gray-900">
            {{ profile.name }} {{ profile.lastName }}
          </h2>
          <button @click="showEditModal = true"
            class="px-3 py-1 bg-teal-600 text-white rounded-md text-sm hover:bg-teal-700 transition-colors">
            Edit Profile
          </button>
        </div>
        <p class="text-sm text-gray-500 mt-1">{{ profile.email }}</p>
      </div>

      <div class="px-6 py-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Personal Information -->
          <div>
            <h3 class="text-sm font-medium text-gray-500">Personal Information</h3>
            <dl class="mt-2 space-y-3">
              <div class="grid grid-cols-3 gap-4">
                <dt class="text-sm font-medium text-gray-500">First Name</dt>
                <dd class="col-span-2 text-sm text-gray-900">{{ profile.name }}</dd>
              </div>
              <div class="grid grid-cols-3 gap-4">
                <dt class="text-sm font-medium text-gray-500">Last Name</dt>
                <dd class="col-span-2 text-sm text-gray-900">{{ profile.lastName }}</dd>
              </div>
              <div class="grid grid-cols-3 gap-4">
                <dt class="text-sm font-medium text-gray-500">Email</dt>
                <dd class="col-span-2 text-sm text-gray-900">{{ profile.email }}</dd>
              </div>
              <div class="grid grid-cols-3 gap-4">
                <dt class="text-sm font-medium text-gray-500">Phone</dt>
                <dd class="col-span-2 text-sm text-gray-900">{{ profile.phone }}</dd>
              </div>
            </dl>
          </div>

          <!-- Professional Information -->
          <div>
            <h3 class="text-sm font-medium text-gray-500">Professional Information</h3>
            <dl class="mt-2 space-y-3">
              <div class="grid grid-cols-3 gap-4">
                <dt class="text-sm font-medium text-gray-500">Location</dt>
                <dd class="col-span-2 text-sm text-gray-900">{{ profile.location }}</dd>
              </div>
              <div class="grid grid-cols-3 gap-4">
                <dt class="text-sm font-medium text-gray-500">Status</dt>
                <dd class="col-span-2">
                  <span :class="{
                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full': true,
                    'bg-green-100 text-green-800': profile.status === 'active',
                    'bg-red-100 text-red-800': profile.status === 'inactive',
                    'bg-yellow-100 text-yellow-800': profile.status === 'pending'
                  }">
                    {{ profile.status }}
                  </span>
                </dd>
              </div>
              <div class="grid grid-cols-3 gap-4">
                <dt class="text-sm font-medium text-gray-500">Payroll ID</dt>
                <dd class="col-span-2 text-sm text-gray-900">{{ profile.payrollId }}</dd>
              </div>
              <div class="grid grid-cols-3 gap-4">
                <dt class="text-sm font-medium text-gray-500">Provider ID</dt>
                <dd class="col-span-2 text-sm text-gray-900">{{ profile.providerId }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>

    <!-- Edit Profile Modal -->
    <div v-if="showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Edit Profile</h3>

          <form @submit.prevent="saveProfile" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input id="name" v-model="profile.name" type="text" required
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm">
            </div>

            <div>
              <label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input id="lastName" v-model="profile.lastName" type="text" required
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm">
            </div>

            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input id="email" v-model="profile.email" type="email" required
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm">
            </div>

            <div>
              <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input id="phone" v-model="profile.phone" type="tel"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm">
            </div>

            <div>
              <label for="location" class="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <select id="location" v-model="profile.location"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm">
                <option v-for="loc in locations" :key="loc" :value="loc">{{ loc }}</option>
              </select>
            </div>

            <div>
              <label for="status" class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select id="status" v-model="profile.status"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div>
              <label for="payrollId" class="block text-sm font-medium text-gray-700 mb-1">Payroll ID</label>
              <input id="payrollId" v-model="profile.payrollId" type="text"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm">
            </div>

            <div>
              <label for="providerId" class="block text-sm font-medium text-gray-700 mb-1">Provider ID</label>
              <input id="providerId" v-model="profile.providerId" type="text"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm">
            </div>

            <div class="md:col-span-2 mt-6 flex justify-end space-x-3">
              <button type="button" @click="showEditModal = false"
                class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors">
                Cancel
              </button>
              <button type="submit" :disabled="isLoading"
                class="px-4 py-2 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <span v-if="isLoading">Saving...</span>
                <span v-else>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </main>

  <TheFooter />
</template>
