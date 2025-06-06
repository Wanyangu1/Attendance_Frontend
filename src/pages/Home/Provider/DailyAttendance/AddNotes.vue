<script setup>
import { ref, onMounted } from 'vue'
import axiosInstance from '@/axiosconfig/axiosInstance'
import TheFooter from '@/components/TheFooter.vue'
import TheNavbar from '@/components/TheNavbar.vue'

const client = ref({
  name: 'MORGAN CAPRETTO',
  service: 'DTA',
  date: '06/06/2025',
  time: '08:00-16:00'
})

const goals = ref([])
const newNote = ref('')

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

// Fetch goals from backend
const fetchGoals = async () => {
  try {
    const response = await axiosInstance.get(`/api/goals?client=${client.value.name}`)
    goals.value = response.data.map(goal => ({
      ...goal,
      trials: goal.trials || [{ progress: '', percentage: '0%', value: '', initials: '' }],
      dailyNotes: goal.dailyNotes || ''
    }))
  } catch (error) {
    console.error('Error fetching goals:', error)
    // Sample data for demo purposes
    goals.value = [
      {
        id: 1,
        description: 'To increase independence Morgan will follow a proper bathing routine',
        activities: 'Morgan will wash her body during bath time with hand over hand support or two verbal prompts from staff',
        outcome: '4/5 trials every six weeks',
        trials: [{ progress: '', percentage: '0%', value: '', initials: '' }],
        dailyNotes: '',
        providerInitials: ''
      },
      {
        id: 2,
        description: 'To increase activities of daily living Morgan will pause between bites during meals and chew her food with two verbal prompts',
        activities: 'Pause between bites during meals and chew food properly',
        outcome: '4/5 trials every six weeks',
        trials: [{ progress: '', percentage: '0%', value: '', initials: '' }],
        dailyNotes: '',
        providerInitials: ''
      }
    ]
  }
}

const addTrial = (goalId) => {
  const goal = goals.value.find(g => g.id === goalId)
  if (goal) {
    goal.trials.push({ progress: '', percentage: '0%', value: '', initials: '' })
  }
}

const saveProgress = async () => {
  try {
    await axiosInstance.post('/api/progress', {
      client: client.value.name,
      date: client.value.date,
      goals: goals.value
    })
    alert('Progress saved successfully!')
  } catch (error) {
    console.error('Error saving progress:', error)
    alert('Failed to save progress')
  }
}

onMounted(() => {
  fetchGoals()
})
</script>

<template>
  <TheNavbar />
  <div class="min-h-screen bg-gray-50 p-6">
    <!-- Client Header -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Patient's Name:</label>
          <p class="mt-1 text-lg font-semibold">{{ client.name }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Service:</label>
          <p class="mt-1 text-lg">{{ client.service }}</p>
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
    <div class="space-y-8">
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
    <div class="mt-6 bg-white rounded-lg shadow p-6">
      <label class="block text-sm font-medium text-gray-700">Additional Notes</label>
      <textarea v-model="newNote" rows="3"
        class="mt-1 focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 rounded-md border p-2"></textarea>
    </div>

    <!-- Save Button -->
    <div class="mt-6 flex justify-end">
      <button @click="saveProgress"
        class="px-4 py-2 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700">
        Save Progress
      </button>
    </div>
  </div>
  <TheFooter />
</template>
