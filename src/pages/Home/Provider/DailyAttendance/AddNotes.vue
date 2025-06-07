<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import axiosInstance from '@/axiosconfig/axiosInstance'
import TheFooter from '@/components/TheFooter.vue'
import TheNavbar from '@/components/TheNavbar.vue'

const route = useRoute()

// Dynamic client data - initialized with route state data
const client = ref({
  id: route.params.id,
  name: route.state?.clientData?.name || '',
  service: route.state?.clientData?.service || '',
  date: route.state?.clientData?.date || '',
  timeIn: route.state?.clientData?.timeIn || '',
  timeOut: route.state?.clientData?.timeOut || '',
  location: route.state?.clientData?.location || '',
  time: route.state?.clientData?.timeIn && route.state?.clientData?.timeOut
    ? `${route.state.clientData.timeIn}-${route.state.clientData.timeOut}`
    : ''
})

// Goals data
const goals = ref([])
const newNote = ref('')
const isLoading = ref(true)
const error = ref(null)

// Percentage options for dropdown
const percentageOptions = ref([
  { value: '0%', text: '0%' },
  { value: '25%', text: '25%' },
  { value: '50%', text: '50%' },
  { value: '75%', text: '75%' },
  { value: '100%', text: '100%' }
])

// Value options for dropdown
const valueOptions = ref([
  { value: 'Barriers', text: 'Barriers' },
  { value: 'HH', text: 'HH-Hand over hand' },
  { value: 'I', text: 'I-Independent' },
  { value: 'M', text: 'M-Modelling' },
  { value: 'P', text: 'P-Physical prompt' },
  { value: 'R', text: 'R-Refused' },
  { value: 'S', text: 'S-Visual (sight) prompt' },
  { value: 'G', text: 'G-Gesture prompt' },
  { value: 'VP', text: 'VP-Verbal prompt' }
])

// Fetch client details based on ID
const fetchClientDetails = async () => {
  try {
    isLoading.value = true
    error.value = null

    // If we already have complete data from route state, skip API call
    if (route.state?.clientData &&
      route.state.clientData.name &&
      route.state.clientData.service &&
      route.state.clientData.date) {
      isLoading.value = false
      return
    }

    // Otherwise, fetch from API
    const response = await axiosInstance.get(`/api/clients/${client.value.id}`)
    const data = response.data

    // Only update fields that aren't already populated from route state
    client.value = {
      ...client.value,
      name: client.value.name || data.client,
      service: client.value.service || data.service,
      date: client.value.date || data.date,
      timeIn: client.value.timeIn || data.time_in,
      timeOut: client.value.timeOut || data.time_out,
      location: client.value.location || data.location,
      time: client.value.time || `${data.time_in || ''}-${data.time_out || ''}`
    }
  } catch (err) {
    console.error('Error fetching client details:', err)
    error.value = 'Failed to load client details'

    // If we don't have any client data at all, set defaults
    if (!client.value.name) {
      client.value = {
        ...client.value,
        name: 'Unknown Client',
        service: 'Unknown Service',
        date: 'N/A',
        time: 'N/A'
      }
    }
  } finally {
    isLoading.value = false
  }
}

// Fetch goals for this client
const fetchGoals = async () => {
  try {
    isLoading.value = true
    error.value = null

    const response = await axiosInstance.get(`/api/goals/goals/`, {
      params: {
        clientId: client.value.id,
        date: client.value.date
      }
    })

    goals.value = response.data.map(goal => ({
      ...goal,
      trials: goal.trials || [{ progress: '', percentage: '0%', value: '', initials: '' }],
      dailyNotes: goal.dailyNotes || ''
    }))

    // If no goals returned, use sample data
    if (goals.value.length === 0) {
      goals.value = getSampleGoals()
    }
  } catch (err) {
    console.error('Error fetching goals:', err)
    error.value = 'Failed to load goals'
    goals.value = getSampleGoals()
  } finally {
    isLoading.value = false
  }
}

// Sample data for demo purposes
const getSampleGoals = () => {
  return [
    {
      id: 1,
      description: 'To increase independence the client will follow a proper bathing routine',
      activities: 'Client will wash their body during bath time with hand over hand support or two verbal prompts from staff',
      outcome: '4/5 trials every six weeks',
      trials: [{ progress: '', percentage: '0%', value: '', initials: '' }],
      dailyNotes: '',
      providerInitials: ''
    },
    {
      id: 2,
      description: 'To increase activities of daily living the client will pause between bites during meals and chew food with two verbal prompts',
      activities: 'Pause between bites during meals and chew food properly',
      outcome: '4/5 trials every six weeks',
      trials: [{ progress: '', percentage: '0%', value: '', initials: '' }],
      dailyNotes: '',
      providerInitials: ''
    }
  ]
}

// Add a new trial to a goal
const addTrial = (goalId) => {
  const goal = goals.value.find(g => g.id === goalId)
  if (goal) {
    goal.trials.push({ progress: '', percentage: '0%', value: '', initials: '' })
  }
}

// Save progress to backend
const saveProgress = async () => {
  try {
    isLoading.value = true
    await axiosInstance.post('/api/goals/progress/', {
      clientId: client.value.id,
      clientName: client.value.name,
      date: client.value.date,
      location: client.value.location,
      service: client.value.service,
      timeIn: client.value.timeIn,
      timeOut: client.value.timeOut,
      goals: goals.value,
      additionalNotes: newNote.value
    })
    alert('Progress saved successfully!')
  } catch (err) {
    console.error('Error saving progress:', err)
    alert('Failed to save progress. Please try again.')
  } finally {
    isLoading.value = false
  }
}

// Watch for route changes
watch(() => route.params.id, (newId) => {
  if (newId) {
    client.value.id = newId
    fetchClientDetails()
    fetchGoals()
  }
}, { immediate: true })

// Watch for route state changes (in case component is reused)
watch(() => route.state, (newState) => {
  if (newState?.clientData) {
    client.value = {
      ...client.value,
      ...newState.clientData,
      time: newState.clientData.timeIn && newState.clientData.timeOut
        ? `${newState.clientData.timeIn}-${newState.clientData.timeOut}`
        : client.value.time
    }
  }
}, { deep: true })

// Initial load
onMounted(() => {
  fetchClientDetails()
  fetchGoals()
})
</script>

<template>
  <TheNavbar />
  <div class="min-h-screen bg-gray-50 p-6">
    <!-- Loading state -->
    <div v-if="isLoading" class="text-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
      <p class="mt-2 text-gray-600">Loading client data...</p>
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

    <!-- Client Header -->
    <div v-if="!isLoading" class="bg-white rounded-lg shadow p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Patient's Name:</label>
          <p class="mt-1 text-lg font-semibold">{{ client.name }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Service:</label>
          <p class="mt-1 text-lg">{{ client.service }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Location:</label>
          <p class="mt-1 text-lg">{{ client.location }}</p>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Date:</label>
            <p class="mt-1 text-lg">{{ client.date }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Time:</label>
            <p class="mt-1 text-lg">{{ client.time }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Goals Section -->
    <div v-if="!isLoading" class="space-y-8">
      <div v-for="(goal, goalIndex) in goals" :key="goal.id" class="bg-white rounded-lg shadow overflow-hidden">
        <!-- Goal Header -->
        <div class="bg-teal-600 px-6 py-3">
          <h3 class="text-lg font-medium text-white">Goal {{ goalIndex + 1 }}: {{ goal.description }}</h3>
        </div>

        <div class="p-6">
          <!-- Activities & Outcome -->
          <div class="mb-6">
            <h4 class="text-sm font-medium text-gray-700 mb-1">Activities - Barriers</h4>
            <p class="text-gray-800">{{ goal.activities }}</p>

            <h4 class="text-sm font-medium text-gray-700 mt-3 mb-1">OUTCOME:</h4>
            <p class="text-gray-800">{{ goal.outcome }}</p>
          </div>

          <!-- Progress Table -->
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                  <th scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage
                  </th>
                  <th scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  <th scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider
                    Initials</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="(trial, trialIndex) in goal.trials" :key="trialIndex">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <input v-model="trial.progress" type="text"
                      class="focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 rounded-md border p-2"
                      :placeholder="`Trial ${trialIndex + 1}`">
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <select v-model="trial.percentage"
                      class="focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 rounded-md border p-2">
                      <option disabled value="">Select Percentage</option>
                      <option v-for="option in percentageOptions" :key="option.value" :value="option.value">
                        {{ option.text }}
                      </option>
                    </select>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <select v-model="trial.value"
                      class="focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 rounded-md border p-2">
                      <option disabled value="">Select Value</option>
                      <option v-for="option in valueOptions" :key="option.value" :value="option.value">
                        {{ option.text }}
                      </option>
                    </select>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <input v-model="trial.initials" type="text"
                      class="focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 rounded-md border p-2">
                  </td>
                </tr>
              </tbody>
            </table>
            <button @click="addTrial(goal.id)"
              class="mt-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200">
              + Add Trial
            </button>
          </div>

          <!-- Daily Notes -->
          <div class="mt-6">
            <label class="block text-sm font-medium text-gray-700">Daily Progress Summary Notes</label>
            <textarea v-model="goal.dailyNotes" rows="3"
              class="mt-1 focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 rounded-md border p-2"></textarea>

            <div class="mt-3 flex justify-between items-center">
              <label class="block text-sm font-medium text-gray-700">Provider(s) Initials</label>
              <input v-model="goal.providerInitials" type="text"
                class="focus:ring-teal-500 focus:border-teal-500 block w-20 sm:text-sm border-gray-300 rounded-md border p-2">
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- General Notes -->
    <div v-if="!isLoading" class="mt-6 bg-white rounded-lg shadow p-6">
      <label class="block text-sm font-medium text-gray-700">Additional Notes</label>
      <textarea v-model="newNote" rows="3"
        class="mt-1 focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 rounded-md border p-2"></textarea>
    </div>

    <!-- Save Button -->
    <div v-if="!isLoading" class="mt-6 flex justify-end">
      <button @click="saveProgress" :disabled="isLoading"
        class="px-4 py-2 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed">
        <span v-if="isLoading">Saving...</span>
        <span v-else>Save Progress</span>
      </button>
    </div>
  </div>
  <TheFooter />
</template>
