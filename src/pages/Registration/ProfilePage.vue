<script setup>
import { ref, computed, onMounted } from 'vue'
import axiosInstance from '@/axiosconfig/axiosInstance'
import TheNavbar from '@/components/TheNavbar.vue'
import TheFooter from '@/components/TheFooter.vue'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { CameraIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'

const profile = ref({
  id: null,
  name: '',
  email: '',
  phone: null,
  avatar: null,
})

const editableProfile = ref({ ...profile.value })
const loading = ref(true)
const updating = ref(false)
const error = ref(null)
const success = ref(false)
const errors = ref({})
const showAvatarUpload = ref(false)

// Compute initials for avatar placeholder
const initials = computed(() => {
  if (!profile.value.name) return '?'
  const names = profile.value.name.trim().split(/\s+/)
  // Get first letter of first and last name (if available)
  return names.length > 1
    ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
    : names[0][0].toUpperCase()
})

// Compute background color based on initials for consistent appearance
const avatarBgColor = computed(() => {
  if (!profile.value.name) return 'bg-gray-400'
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ]
  const charCode = profile.value.name.charCodeAt(0)
  return colors[charCode % colors.length]
})

// Fetch profile data
const fetchProfile = async () => {
  try {
    loading.value = true
    error.value = null
    const response = await axiosInstance.get('/api/profile/')
    profile.value = response.data
    editableProfile.value = { ...profile.value }
  } catch (err) {
    error.value = 'Failed to load profile data. Please try again later.'
    console.error('Error fetching profile:', err)
  } finally {
    loading.value = false
  }
}

// Update profile
const updateProfile = async () => {
  try {
    updating.value = true
    error.value = null
    success.value = false
    errors.value = {}

    // Basic validation
    if (!editableProfile.value.name) {
      errors.value.name = 'Name is required'
      return
    }

    if (editableProfile.value.phone && !/^[\d\s+-]*$/.test(editableProfile.value.phone)) {
      errors.value.phone = 'Please enter a valid phone number'
      return
    }

    const response = await axiosInstance.patch('/api/profile/', editableProfile.value)
    profile.value = response.data
    editableProfile.value = { ...profile.value }
    success.value = true
    setTimeout(() => (success.value = false), 3000)
  } catch (err) {
    if (err.response?.data) {
      // Handle server validation errors
      errors.value = err.response.data
    } else {
      error.value = 'Failed to update profile. Please try again later.'
    }
    console.error('Error updating profile:', err)
  } finally {
    updating.value = false
  }
}

// Handle avatar upload
const handleAvatarUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Validate file type and size
  if (!file.type.match('image.*')) {
    error.value = 'Please select an image file'
    return
  }

  if (file.size > 2 * 1024 * 1024) {
    // 2MB limit
    error.value = 'Image size should be less than 2MB'
    return
  }

  try {
    updating.value = true
    const formData = new FormData()
    formData.append('avatar', file)

    const response = await axiosInstance.patch('/api/profile/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    profile.value.avatar = response.data.avatar
    showAvatarUpload.value = false
    success.value = true
    setTimeout(() => (success.value = false), 3000)
  } catch (err) {
    error.value = 'Failed to upload avatar. Please try again.'
    console.error('Error uploading avatar:', err)
  } finally {
    updating.value = false
  }
}

// Reset form to original values
const resetForm = () => {
  editableProfile.value = { ...profile.value }
  errors.value = {}
}

// Fetch profile on component mount
onMounted(() => {
  fetchProfile()
})
</script>

<template>
  <TheNavbar />
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
      <!-- Profile Card with Soft Shadow -->
      <div class="bg-white shadow-xl rounded-xl overflow-hidden">
        <!-- Profile Header with Gradient Background -->
        <div class="relative bg-gradient-to-r from-blue-700 to-blue-900 px-8 py-6 text-center">
          <!-- Decorative elements -->
          <div class="absolute inset-0 opacity-10">
            <div
              class="absolute top-0 left-0 w-32 h-32 bg-white rounded-full opacity-20 mix-blend-overlay transform -translate-x-1/2 -translate-y-1/2"
            ></div>
            <div
              class="absolute bottom-0 right-0 w-48 h-48 bg-white rounded-full opacity-20 mix-blend-overlay transform translate-x-1/4 translate-y-1/4"
            ></div>
          </div>

          <div
            class="relative mx-auto h-25 w-25 rounded-full border-4 border-white/30 shadow-xl overflow-hidden backdrop-blur-sm"
          >
            <!-- Avatar Image or Initials Placeholder -->
            <img
              v-if="profile.avatar"
              :src="profile.avatar"
              alt="Profile"
              class="h-full w-full object-cover"
            />
            <div
              v-else
              class="h-full w-full flex items-center justify-center"
              :class="avatarBgColor"
            >
              <span class="text-5xl font-bold text-white">{{ initials }}</span>
            </div>
            <!-- Avatar Upload Button -->
            <button
              @click="showAvatarUpload = true"
              class="absolute bottom-0 right-0 bg-white/90 p-2 rounded-full shadow-md hover:bg-white transition-all duration-300 hover:scale-110"
              aria-label="Change profile picture"
            >
              <CameraIcon class="h-5 w-5 text-indigo-600" />
            </button>
          </div>
          <h1 class="mt-6 text-3xl font-bold text-white tracking-tight">{{ profile.name }}</h1>
          <p class="text-indigo-100/90 mt-2">{{ profile.email }}</p>
          <p v-if="profile.phone" class="text-indigo-100/80 mt-1 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            {{ profile.phone }}
          </p>
        </div>

        <!-- Main Content Area -->
        <div class="px-8 py-8 divide-y divide-gray-200/50">
          <!-- Loading State -->
          <div v-if="loading" class="flex justify-center py-12">
            <div
              class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"
            ></div>
          </div>

          <!-- Error Message -->
          <div
            v-if="error"
            class="mb-8 p-4 bg-red-50/80 rounded-lg backdrop-blur-sm border border-red-100"
          >
            <div class="flex items-center">
              <ExclamationCircleIcon class="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
              <p class="text-red-700">{{ error }}</p>
            </div>
          </div>

          <!-- Success Message -->
          <div
            v-if="success"
            class="mb-8 p-4 bg-green-50/80 rounded-lg backdrop-blur-sm border border-green-100"
          >
            <div class="flex items-center">
              <CheckCircleIcon class="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <p class="text-green-700">Profile updated successfully!</p>
            </div>
          </div>

          <!-- Profile Edit Form -->
          <form v-if="!loading" @submit.prevent="updateProfile" class="space-y-8">
            <!-- Personal Information Section -->
            <div>
              <div class="mb-8">
                <h2 class="text-xl font-semibold text-gray-800 tracking-tight">
                  Personal Information
                </h2>
                <p class="mt-2 text-sm text-gray-500">
                  Update your personal details. This information will be visible to other users
                  where applicable.
                </p>
              </div>

              <div class="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-6">
                <!-- Name Field -->
                <div class="sm:col-span-6">
                  <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
                    User Name <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <input
                      v-model="editableProfile.name"
                      type="text"
                      id="name"
                      class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-4 border bg-white/80 backdrop-blur-sm transition-all duration-200"
                      :class="{
                        'border-red-300': errors.name,
                        'ring-1 ring-indigo-500': !errors.name && editableProfile.name,
                      }"
                      placeholder="Enter your full name"
                    />
                    <div
                      v-if="editableProfile.name && !errors.name"
                      class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
                    >
                      <CheckCircleIcon class="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                  <p v-if="errors.name" class="mt-2 text-sm text-red-600 flex items-center">
                    <ExclamationCircleIcon class="h-4 w-4 mr-1 flex-shrink-0" />
                    {{ errors.name }}
                  </p>
                </div>

                <!-- Email Field (readonly) -->
                <div class="sm:col-span-6">
                  <label for="email" class="block text-sm font-medium text-gray-700 mb-1"
                    >Email address</label
                  >
                  <div class="relative">
                    <input
                      v-model="editableProfile.email"
                      type="email"
                      id="email"
                      class="mt-1 block w-full rounded-lg bg-gray-100/50 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-4 border"
                      :class="{ 'border-red-300': errors.email }"
                      disabled
                      readonly
                    />
                    <div
                      class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
                    >
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
                          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                        />
                      </svg>
                    </div>
                  </div>
                  <p v-if="errors.email" class="mt-2 text-sm text-red-600">{{ errors.email }}</p>
                  <p class="mt-2 text-xs text-gray-500 flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-3.5 w-3.5 mr-1 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Contact support if you need to change your email address.
                  </p>
                </div>

                <!-- Phone Field -->
                <div class="sm:col-span-6">
                  <label for="phone" class="block text-sm font-medium text-gray-700 mb-1"
                    >Phone number</label
                  >
                  <div class="relative">
                    <input
                      v-model="editableProfile.phone"
                      type="tel"
                      id="phone"
                      class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-4 border bg-white/80 backdrop-blur-sm"
                      :class="{
                        'border-red-300': errors.phone,
                        'ring-1 ring-indigo-500': !errors.phone && editableProfile.phone,
                      }"
                      placeholder="+1 (555) 123-4567"
                    />
                    <div
                      v-if="editableProfile.phone && !errors.phone"
                      class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
                    >
                      <CheckCircleIcon class="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                  <p v-if="errors.phone" class="mt-2 text-sm text-red-600 flex items-center">
                    <ExclamationCircleIcon class="h-4 w-4 mr-1 flex-shrink-0" />
                    {{ errors.phone }}
                  </p>
                  <p class="mt-2 text-xs text-gray-500 flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-3.5 w-3.5 mr-1 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Provide a phone number where we can reach you in case of urgent matters.
                  </p>
                </div>
              </div>
            </div>

            <!-- Form Actions -->
            <div class="flex justify-end space-x-4 pt-8 border-t border-gray-200/50">
              <button
                type="button"
                @click="resetForm"
                class="px-5 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 hover:shadow-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="updating"
                class="inline-flex justify-center px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
              >
                <span v-if="updating" class="flex items-center">
                  <svg
                    class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </span>
                <span v-else class="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4 mr-1.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Save Changes
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Avatar Upload Modal -->
    <TransitionRoot as="template" :show="showAvatarUpload">
      <Dialog as="div" class="relative z-50" @close="showAvatarUpload = false">
        <TransitionChild
          as="template"
          enter="ease-out duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="ease-in duration-200"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-gray-500/80 backdrop-blur-sm transition-opacity" />
        </TransitionChild>

        <div class="fixed inset-0 z-10 overflow-y-auto">
          <div
            class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0"
          >
            <TransitionChild
              as="template"
              enter="ease-out duration-300"
              enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enter-to="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leave-from="opacity-100 translate-y-0 sm:scale-100"
              leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel
                class="relative transform overflow-hidden rounded-xl bg-white px-6 pt-6 pb-6 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:p-8"
              >
                <div>
                  <div
                    class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100/80 backdrop-blur-sm"
                  >
                    <CameraIcon class="h-8 w-8 text-indigo-600" />
                  </div>
                  <div class="mt-4 text-center sm:mt-5">
                    <DialogTitle
                      as="h3"
                      class="text-xl font-semibold leading-6 text-gray-900 tracking-tight"
                      >Update Profile Picture
                    </DialogTitle>
                    <div class="mt-2">
                      <p class="text-sm text-gray-500">
                        Upload a clear photo of your face. JPG or PNG, max 2MB.
                      </p>
                    </div>
                  </div>
                </div>
                <div class="mt-6 sm:mt-7 space-y-3">
                  <input
                    type="file"
                    ref="avatarInput"
                    accept="image/jpeg,image/png"
                    class="hidden"
                    @change="handleAvatarUpload"
                  />
                  <button
                    type="button"
                    class="inline-flex w-full justify-center rounded-xl border border-transparent bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm transition-all duration-200"
                    @click="$refs.avatarInput.click()"
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
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    Select Photo
                  </button>
                  <button
                    type="button"
                    class="inline-flex w-full justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm transition-all duration-200"
                    @click="showAvatarUpload = false"
                  >
                    Cancel
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
  <TheFooter />
</template>

<style scoped>
/* Enhanced transitions for interactive elements */
button,
input,
select,
textarea {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Custom focus styles */
.focus-visible:focus {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}

/* Avatar placeholder animation */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

.avatar-placeholder {
  animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

/* Smooth gradient transitions */
.bg-gradient-to-r {
  transition: background 0.5s ease;
}

/* Enhanced shadow transitions */
.shadow-md {
  transition: box-shadow 0.3s ease;
}

/* Backdrop blur for modern glass effect */
.backdrop-blur-sm {
  backdrop-filter: blur(4px);
}
</style>
