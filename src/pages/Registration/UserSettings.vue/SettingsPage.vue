<script setup>
import { ref, onMounted } from 'vue'
import TheNavbar from '@/components/TheNavbar.vue'
import TheFooter from '@/components/TheFooter.vue'
import axiosInstance from '@/axiosconfig/axiosInstance'


const form = ref({
  street_address: '',
  address2: '',
  city: '',
  state: '',
  zip_code: '',
  manager_name: ''
})

const isLoading = ref(true)
const isSubmitting = ref(false)
const showSuccess = ref(false)
const showError = ref(false)

const fetchSettings = async () => {
  try {
    const response = await axiosInstance.get('/api/user/settings/')
    form.value = response.data
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('No settings found, you can create new ones.')
    } else {
      console.error(error)
      showError.value = true
    }
  } finally {
    isLoading.value = false
  }
}

const submitForm = async () => {
  isSubmitting.value = true
  showSuccess.value = false
  showError.value = false

  try {
    const response = await axiosInstance.put('/api/user/settings/', form.value)
    if (response.status === 200) {
      showSuccess.value = true
      setTimeout(() => showSuccess.value = false, 3000)
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      await axiosInstance.post('/api/settings/create/', form.value)
      showSuccess.value = true
      setTimeout(() => showSuccess.value = false, 3000)
    } else {
      console.error(error)
      showError.value = true
    }
  } finally {
    isSubmitting.value = false
  }
}

onMounted(fetchSettings)
</script>

<template>
  <TheNavbar />
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <!-- Success Alert -->
      <transition enter-active-class="transition ease-out duration-300" enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100" leave-active-class="transition ease-in duration-200"
        leave-from-class="transform opacity-100 scale-100" leave-to-class="transform opacity-0 scale-95">
        <div v-if="showSuccess" class="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                fill="currentColor">
                <path fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-green-800">
                Settings saved successfully!
              </p>
            </div>
          </div>
        </div>
      </transition>

      <!-- Error Alert -->
      <transition enter-active-class="transition ease-out duration-300" enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100" leave-active-class="transition ease-in duration-200"
        leave-from-class="transform opacity-100 scale-100" leave-to-class="transform opacity-0 scale-95">
        <div v-if="showError" class="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                fill="currentColor">
                <path fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-red-800">
                An error occurred while saving settings.
              </p>
            </div>
          </div>
        </div>
      </transition>

      <div class="bg-white shadow-xl rounded-xl overflow-hidden">
        <!-- Header -->
        <div class="px-6 py-5 bg-gradient-to-r from-indigo-600 to-purple-600">
          <h2 class="text-2xl font-bold text-white">User Settings</h2>
          <p class="mt-1 text-indigo-100">Manage your personal and address information</p>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="p-8 flex justify-center">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>

        <!-- Form -->
        <form v-else @submit.prevent="submitForm" class="px-6 py-8 space-y-6">
          <!-- Address Section -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-gray-900 flex items-center">
              <font-awesome-icon :icon="['fas', 'home']" class="mr-2 text-indigo-500" />
              Address Information
            </h3>

            <div class="grid grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-6">
              <!-- Street Address -->
              <div class="sm:col-span-6">
                <label for="street_address" class="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <font-awesome-icon :icon="['fas', 'map-marker-alt']" class="mr-2 text-gray-400" />
                  Street Address
                </label>
                <input id="street_address" v-model="form.street_address" type="text" required
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-4 border bg-white/80 backdrop-blur-sm transition-all duration-200"
                  placeholder="123 Main St">
              </div>

              <!-- Address Line 2 -->
              <div class="sm:col-span-6">
                <label for="address2" class="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 2 (Optional)
                </label>
                <input id="address2" v-model="form.address2" type="text"
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-4 border bg-white/80 backdrop-blur-sm transition-all duration-200"
                  placeholder="Apt 4B">
              </div>

              <!-- City -->
              <div class="sm:col-span-3">
                <label for="city" class="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <font-awesome-icon :icon="['fas', 'city']" class="mr-2 text-gray-400" />
                  City
                </label>
                <input id="city" v-model="form.city" type="text" required
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-4 border bg-white/80 backdrop-blur-sm transition-all duration-200"
                  placeholder="New York">
              </div>

              <!-- State -->
              <div class="sm:col-span-2">
                <label for="state" class="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <font-awesome-icon :icon="['fas', 'flag']" class="mr-2 text-gray-400" />
                  State
                </label>
                <input id="state" v-model="form.state" type="text" required
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-4 border bg-white/80 backdrop-blur-sm transition-all duration-200"
                  placeholder="NY">
              </div>

              <!-- ZIP Code -->
              <div class="sm:col-span-1">
                <label for="zip_code" class="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <font-awesome-icon :icon="['fas', 'mail-bulk']" class="mr-2 text-gray-400" />
                  ZIP Code
                </label>
                <input id="zip_code" v-model="form.zip_code" type="text" required
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-4 border bg-white/80 backdrop-blur-sm transition-all duration-200"
                  placeholder="10001">
              </div>
            </div>
          </div>

          <!-- Manager Section -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-gray-900 flex items-center">
              <font-awesome-icon :icon="['fas', 'user-tie']" class="mr-2 text-indigo-500" />
              Manager Information
            </h3>

            <div class="grid grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-6">
              <div class="sm:col-span-6">
                <label for="manager_name" class="block text-sm font-medium text-gray-700 mb-1">
                  Manager Name
                </label>
                <input id="manager_name" v-model="form.manager_name" type="text" required
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-4 border bg-white/80 backdrop-blur-sm transition-all duration-200"
                  placeholder="John Doe">
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="flex justify-end pt-6 border-t border-gray-200">
            <button type="submit" :disabled="isSubmitting"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 hover:shadow-md disabled:opacity-75 disabled:cursor-not-allowed">
              <font-awesome-icon v-if="isSubmitting" :icon="['fas', 'spinner']" class="animate-spin mr-2" />
              <font-awesome-icon v-else :icon="['fas', 'save']" class="mr-2" />
              {{ isSubmitting ? 'Saving...' : 'Save Settings' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
  <TheFooter />
</template>

<style scoped>
/* Custom transitions */
button,
input,
select,
textarea {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Backdrop blur effect */
.backdrop-blur-sm {
  backdrop-filter: blur(4px);
}

/* Smooth gradient transitions */
.bg-gradient-to-r {
  transition: background 0.5s ease;
}

/* Enhanced shadow transitions */
.shadow-md {
  transition: box-shadow 0.3s ease;
}
</style>
