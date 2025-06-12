<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import axiosInstance from '@/axiosconfig/axiosInstance'
import TheFooter from '@/components/TheFooter.vue'
import TheNavbar from '@/components/TheNavbar.vue'

const route = useRoute()

// Get current Arizona date (MST, no DST)
const getArizonaDate = () => {
  const now = new Date()
  const options = { timeZone: 'America/Phoenix', month: '2-digit', day: '2-digit', year: 'numeric' }
  return now.toLocaleDateString('en-US', options)
}

// Client data structure
const client = ref({
  id: route.params.id,
  clientId: '',
  firstName: '',
  lastName: '',
  location: '',
  billType: '',
  phone: '',
  date: getArizonaDate() // Set current Arizona date by default
})

// Goals data
const goals = ref([])
const newNote = ref('')
const isLoading = ref(true)
const error = ref(null)
const existingProgressId = ref(null) // To track existing progress ID

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

// Format date for API (MM-DD-YYYY)
const formatDateForAPI = (dateStr) => {
  return dateStr.replace(/\//g, '-')
}

// Fetch client details based on ID
const fetchClientDetails = async () => {
  try {
    isLoading.value = true
    error.value = null

    const response = await axiosInstance.get(`/api/clients/${client.value.id}`)
    const data = response.data

    client.value = {
      ...client.value,
      clientId: data.clientId,
      firstName: data.firstName,
      lastName: data.lastName,
      location: data.location,
      billType: data.billType,
      phone: data.phone
    }

    await fetchGoals()
    await fetchExistingProgress()
  } catch (err) {
    console.error('Error fetching client details:', err)
    error.value = 'Failed to load client details'
  } finally {
    isLoading.value = false
  }
}

// Fetch goals for this specific client
const fetchGoals = async () => {
  try {
    if (!client.value.id) return;

    isLoading.value = true;
    error.value = null;

    const response = await axiosInstance.get(`/api/goals/${client.value.id}`);

    const goalsData = Array.isArray(response.data)
      ? response.data
      : [response.data];

    goals.value = goalsData.map(goal => ({
      ...goal,
      trials: goal.trials || [{ progress: '', percentage: '0%', value: '', initials: '' }],
      dailyNotes: goal.dailyNotes || '',
      providerInitials: goal.providerInitials || ''
    }));
  } catch (err) {
    console.error('Error fetching goals:', err);
    error.value = 'No goals & outcomes found for this client';
    goals.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Fetch existing progress for this client on the current date
const fetchExistingProgress = async () => {
  try {
    const response = await axiosInstance.get('/api/progress/')

    // Filter progress records for the current client and date
    const formattedDate = formatDateForAPI(client.value.date)
    const progressForDate = response.data.filter(item => {
      // Convert the item's date to match your formatted date (MM-DD-YYYY)
      const itemDateParts = item.date.split('/')
      const itemFormattedDate = `${itemDateParts[0]}-${itemDateParts[1]}-${itemDateParts[2]}`
      return itemFormattedDate === formattedDate && item.client === client.value.id
    })

    if (progressForDate.length > 0) {
      const progress = progressForDate[0]
      existingProgressId.value = progress.id
      newNote.value = progress.general_notes || ''
      client.value.location = progress.location || client.value.location

      const trialsResponse = await axiosInstance.get(`/api/progress/${progress.id}/trials/`)
      const trialsData = trialsResponse.data

      goals.value.forEach(goal => {
        const goalTrials = trialsData
          .filter(trial => trial.goal === goal.id)
          .map(trial => ({
            id: trial.id,
            progress: trial.trial_number.toString(),
            percentage: trial.percentage,
            value: trial.value,
            initials: trial.initials
          }))

        goal.trials = goalTrials.length > 0 ? goalTrials : [{ progress: '', percentage: '0%', value: '', initials: '' }]
        goal.providerInitials = progress.provider_initials || ''
      })
    } else {
      existingProgressId.value = null
    }
  } catch (err) {
    console.error('Error fetching existing progress:', err)
    existingProgressId.value = null
  }
}

// Add a new trial to a goal
const addTrial = (goalId) => {
  const goal = goals.value.find(g => g.id === goalId)
  if (goal) {
    goal.trials.push({ progress: '', percentage: '0%', value: '', initials: '' })
  }
}

// Delete a trial
const deleteTrial = async (goalId, trialId, trialIndex) => {
  try {
    if (trialId) {
      await axiosInstance.delete(`/api/trials/${trialId}/`)
    }
    const goal = goals.value.find(g => g.id === goalId)
    if (goal) {
      goal.trials.splice(trialIndex, 1)
    }
  } catch (err) {
    console.error('Error deleting trial:', err)
    alert('Failed to delete trial')
  }
}

// Validate before saving
const validateBeforeSave = () => {
  if (!client.value.location) {
    alert('Location is required')
    return false
  }

  // Check that at least one trial has values
  const hasValidTrials = goals.value.some(goal =>
    goal.trials.some(trial => trial.value)
  )

  if (!hasValidTrials) {
    alert('At least one trial must have a value')
    return false
  }

  return true
}

// Save or update progress
const saveProgress = async () => {
  try {
    if (!validateBeforeSave()) return

    isLoading.value = true

    // In saveProgress method, modify the progressData creation:
    const progressData = {
      date: client.value.date,
      location: client.value.location,
      general_notes: goals.value.map(g => g.dailyNotes).filter(Boolean).join('\n\n') + '\n\n' + newNote.value,
      provider_initials: goals.value[0]?.providerInitials || '',
      client: client.value.id,
      created_by: 1
    }

    let dailyProgressId = existingProgressId.value

    if (dailyProgressId) {
      await axiosInstance.put(`/api/progress/${dailyProgressId}/`, progressData)
    } else {
      const progressResponse = await axiosInstance.post('/api/progress/', progressData)
      dailyProgressId = progressResponse.data.id
      existingProgressId.value = dailyProgressId
    }

    for (const goal of goals.value) {
      for (const trial of goal.trials) {
        const trialNumber = parseInt(trial.progress) || goal.trials.indexOf(trial) + 1

        if (trial.value) {
          const trialData = {
            trial_number: trialNumber,
            percentage: trial.percentage,
            value: trial.value,
            initials: trial.initials,
            daily_progress: dailyProgressId,
            goal: goal.id
          }

          if (trial.id) {
            await axiosInstance.put(`/api/trials/${trial.id}/`, trialData)
          } else {
            const trialResponse = await axiosInstance.post('/api/trials/', trialData)
            trial.id = trialResponse.data.id
          }
        }
      }
    }

    alert('Progress saved successfully for ' + client.value.firstName + ' ' + client.value.lastName + '!')
    await fetchExistingProgress()
  } catch (err) {
    console.error('Error saving progress:', err)
    alert('Failed to save progress. Please try again.')
  } finally {
    isLoading.value = false
  }
}

// Confirm before saving
const confirmSave = () => {
  if (confirm('Are you sure you want to save these changes?')) {
    saveProgress()
  }
}

// Watch for route changes
watch(() => route.params.id, (newId) => {
  if (newId) {
    client.value.id = newId
    fetchClientDetails()
  }
}, { immediate: true })

// Watch for date changes to fetch progress for new date
watch(() => client.value.date, () => {
  if (client.value.id) {
    fetchExistingProgress()
  }
})

// Initial load
onMounted(() => {
  fetchClientDetails()
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
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Client Name:</label>
          <p class="mt-1 text-lg font-semibold">{{ client.firstName }} {{ client.lastName }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Client ID:</label>
          <p class="mt-1 text-lg">{{ client.clientId }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Location:</label>
          <input v-model="client.location" type="text" required
            class="mt-1 focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 rounded-md border p-2">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Bill Type:</label>
          <p class="mt-1 text-lg">{{ client.billType }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Phone:</label>
          <p class="mt-1 text-lg">{{ client.phone }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Date (Arizona):</label>
          <input v-model="client.date" type="text"
            class="focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 rounded-md border p-2">
        </div>
      </div>
    </div>

    <!-- Goals Section -->
    <div v-if="!isLoading && goals.length > 0" class="space-y-8">
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
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trial #</th>
                  <th scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage
                  </th>
                  <th scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  <th scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Initials</th>
                  <th scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                  <td class="px-6 py-4 whitespace-nowrap">
                    <button @click="deleteTrial(goal.id, trial.id, trialIndex)" class="text-red-600 hover:text-red-900">
                      Delete
                    </button>
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
            <textarea v-model="newNote" rows="3"
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

    <!-- No Goals Message -->
    <div v-if="!isLoading && goals.length === 0" class="bg-white rounded-lg shadow p-6 text-center">
      <p class="text-gray-600">No goals found for this client.</p>
    </div>

    <!-- General Notes -->
    <div v-if="!isLoading" class="mt-6 bg-white rounded-lg shadow p-6">
      <label class="block text-sm font-medium text-gray-700">Additional Notes</label>
      <textarea v-model="newNote" rows="3"
        class="mt-1 focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 rounded-md border p-2"></textarea>
    </div>

    <!-- Save Button -->
    <div v-if="!isLoading" class="mt-6 flex justify-end">
      <button @click="confirmSave" :disabled="isLoading"
        class="px-4 py-2 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed">
        <span v-if="isLoading">Saving...</span>
        <span v-else>Save Progress</span>
      </button>
    </div>
  </div>
  <TheFooter />
</template>
