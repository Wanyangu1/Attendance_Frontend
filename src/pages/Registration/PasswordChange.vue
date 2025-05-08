<script setup>
import { reactive, ref } from 'vue';
import axiosInstance from '@/axiosconfig/axiosInstance';
import TheNavbar from '@/components/TheNavbar.vue'
import TheFooter from '@/components/TheFooter.vue'

const form = reactive({
  current_password: '',
  new_password: '',
  confirm_password: ''
});

const errors = reactive({
  current_password: '',
  new_password: '',
  confirm_password: ''
});

const message = reactive({
  text: '',
  type: '' // 'success' or 'error'
});

const loading = ref(false);

const validateForm = () => {
  let isValid = true;

  errors.current_password = '';
  errors.new_password = '';
  errors.confirm_password = '';

  if (!form.current_password) {
    errors.current_password = 'Current password is required';
    isValid = false;
  }

  if (!form.new_password) {
    errors.new_password = 'New password is required';
    isValid = false;
  } else if (form.new_password.length < 8) {
    errors.new_password = 'Password must be at least 8 characters';
    isValid = false;
  }

  if (!form.confirm_password) {
    errors.confirm_password = 'Please confirm your new password';
    isValid = false;
  } else if (form.new_password !== form.confirm_password) {
    errors.confirm_password = 'Passwords do not match';
    isValid = false;
  }

  return isValid;
};

const changePassword = async () => {
  if (!validateForm()) return;

  loading.value = true;
  message.text = '';

  try {
    const response = await axiosInstance.post('http://localhost:8000/api/change-password/', {
      current_password: form.current_password,
      new_password: form.new_password
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      }
    });

    message.text = response.data.detail || 'Password changed successfully';
    message.type = 'success';

    form.current_password = '';
    form.new_password = '';
    form.confirm_password = '';

  } catch (error) {
    let errorMessage = 'An error occurred while changing password';

    if (error.response) {
      if (error.response.data.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response.data.new_password) {
        errorMessage = error.response.data.new_password.join(' ');
      }
    }

    message.text = errorMessage;
    message.type = 'error';

  } finally {
    loading.value = false;
  }
};
</script>
<template>
  <TheNavbar />
  <div class="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6">
    <div class="flex items-center justify-start mb-6">
      <svg class="h-8 w-8 text-indigo-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      <h2 class="text-2xl font-bold text-gray-800">Change Password</h2>
    </div>

    <form @submit.prevent="changePassword" class="space-y-6">
      <!-- Current Password -->
      <div>
        <label for="current_password" class="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
        <div class="relative">
          <input v-model="form.current_password" id="current_password" name="current_password" type="password" required
            class="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            :class="{ 'border-red-500': errors.current_password }" />
          <p v-if="errors.current_password" class="mt-1 text-sm text-red-600">{{ errors.current_password }}</p>
        </div>
      </div>

      <!-- New Password -->
      <div>
        <label for="new_password" class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
        <div class="relative">
          <input v-model="form.new_password" id="new_password" name="new_password" type="password" required
            class="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            :class="{ 'border-red-500': errors.new_password }" />
          <p v-if="errors.new_password" class="mt-1 text-sm text-red-600">{{ errors.new_password }}</p>
          <p class="mt-2 text-xs text-gray-500">
            Password must be at least 8 characters long and contain a mix of letters, numbers, and symbols.
          </p>
        </div>
      </div>

      <!-- Confirm New Password -->
      <div>
        <label for="confirm_password" class="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
        <div class="relative">
          <input v-model="form.confirm_password" id="confirm_password" name="confirm_password" type="password" required
            class="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            :class="{ 'border-red-500': errors.confirm_password }" />
          <p v-if="errors.confirm_password" class="mt-1 text-sm text-red-600">{{ errors.confirm_password }}</p>
        </div>
      </div>

      <!-- Success/Error Message -->
      <div v-if="message.text" class="rounded-md p-4" :class="{
        'bg-green-50 text-green-800': message.type === 'success',
        'bg-red-50 text-red-800': message.type === 'error'
      }">
        <div class="flex items-center">
          <svg v-if="message.type === 'success'" class="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <svg v-if="message.type === 'error'" class="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-sm font-medium">{{ message.text }}</p>
        </div>
      </div>

      <!-- Submit Button -->
      <div>
        <button type="submit"
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          :disabled="loading">
          <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg"
            fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
          {{ loading ? 'Changing Password...' : 'Change Password' }}
        </button>
      </div>
    </form>
  </div>
  <TheFooter />
</template>
