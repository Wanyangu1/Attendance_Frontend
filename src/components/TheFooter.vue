<template>
  <footer class="bg-gray-900 text-white pt-16 pb-8">
    <div class="max-w-7xl mx-auto px-6">
      <!-- Main Footer Content -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
        <!-- Brand Column -->
        <div class="space-y-6">
          <div class="flex items-center space-x-3">
            <img src="@/assets/logos/logo1.png" class="h-10" alt="City Radius CHS Logo" />
          </div>
          <p class="text-gray-300 leading-relaxed">
            Providing exceptional community healthcare services with compassion and professionalism
            since 2005.
          </p>
          <div class="flex space-x-3 pt-2">
            <a
              v-for="social in socialLinks"
              :key="social.name"
              :href="social.url"
              target="_blank"
              class="bg-gray-700 hover:bg-blue-500 rounded-full w-10 h-10 flex items-center justify-center transition-all duration-300 hover:scale-105"
              :aria-label="social.name"
            >
              <i :class="social.icon + ' text-lg text-white'"></i>
            </a>
          </div>
        </div>

        <!-- Quick Links -->
        <div>
          <h3 class="text-lg font-semibold mb-6 pb-2 border-b border-gray-700 flex items-center">
            <i class="fas fa-link text-blue-400 mr-2"></i>
            Quick Links
          </h3>
          <ul class="space-y-4">
            <li v-for="link in quickLinks" :key="link.text">
              <router-link
                :to="link.to"
                class="flex items-center space-x-3 group hover:text-blue-300 transition-colors text-gray-300"
              >
                <div
                  class="w-2 h-2 rounded-full bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                ></div>
                <span>{{ link.text }}</span>
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Services -->
        <div>
          <h3 class="text-lg font-semibold mb-6 pb-2 border-b border-gray-700 flex items-center">
            <i class="fas fa-hand-holding-medical text-blue-400 mr-2"></i>
            Our Services
          </h3>
          <ul class="space-y-4">
            <li v-for="service in services" :key="service.text">
              <router-link
                :to="service.to"
                class="flex items-center space-x-3 group hover:text-blue-300 transition-colors text-gray-300"
              >
                <div
                  class="w-2 h-2 rounded-full bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                ></div>
                <span>{{ service.text }}</span>
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Contact Info -->
        <div>
          <h3 class="text-lg font-semibold mb-6 pb-2 border-b border-gray-700 flex items-center">
            <i class="fas fa-headset text-blue-400 mr-2"></i>
            Contact Us
          </h3>
          <ul class="space-y-5">
            <li class="flex items-start space-x-4">
              <div class="bg-blue-400/20 p-2 rounded-full flex-shrink-0">
                <i class="fas fa-phone-alt text-blue-400 text-sm"></i>
              </div>
              <div>
                <p class="font-medium text-white">Phone</p>
                <a href="tel:+254700000000" class="text-gray-300 hover:text-blue-300"
                  >+1(536) 000 000</a
                >
              </div>
            </li>
            <li class="flex items-start space-x-4">
              <div class="bg-blue-400/20 p-2 rounded-full flex-shrink-0">
                <i class="fas fa-envelope text-blue-400 text-sm"></i>
              </div>
              <div>
                <p class="font-medium text-white">Email</p>
                <a href="mailto:info@cityradiuschs.org" class="text-gray-300 hover:text-blue-300"
                  >info@cityradiuschs.org</a
                >
              </div>
            </li>
            <li class="flex items-start space-x-4">
              <div class="bg-blue-400/20 p-2 rounded-full flex-shrink-0">
                <i class="fas fa-map-marker-alt text-blue-400 text-sm"></i>
              </div>
              <div>
                <p class="font-medium text-white">Location</p>
                <p class="text-gray-300">Arizona, USA</p>
              </div>
            </li>
            <li class="flex items-start space-x-4">
              <div class="bg-blue-400/20 p-2 rounded-full flex-shrink-0">
                <i class="fas fa-clock text-blue-400 text-sm"></i>
              </div>
              <div>
                <p class="font-medium text-white">Hours</p>
                <p class="text-gray-300">Mon-Fri: 8am - 5pm</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- Divider -->
      <div class="border-t border-gray-700 my-8"></div>

      <!-- Bottom Footer -->
      <div class="flex flex-col md:flex-row justify-between items-center">
        <div class="mb-4 md:mb-0">
          <p class="text-sm text-gray-400">
            &copy; {{ new Date().getFullYear() }} City Radius Community Health Service. All rights
            reserved.
          </p>
        </div>

        <div class="flex flex-wrap gap-4 justify-center">
          <router-link
            to="/privacy"
            class="text-gray-400 hover:text-blue-300 text-sm transition-colors"
          >
            Privacy Policy
          </router-link>
          <router-link
            to="/terms"
            class="text-gray-400 hover:text-blue-300 text-sm transition-colors"
          >
            Terms of Service
          </router-link>
          <router-link
            to="/accessibility"
            class="text-gray-400 hover:text-blue-300 text-sm transition-colors"
          >
            Accessibility
          </router-link>
          <router-link
            to="/sitemap"
            class="text-gray-400 hover:text-blue-300 text-sm transition-colors"
          >
            Sitemap
          </router-link>
        </div>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  data() {
    return {
      socialLinks: [
        { name: 'Facebook', url: 'https://facebook.com/cityradiuschs', icon: 'fab fa-facebook-f' },
        { name: 'Twitter', url: 'https://twitter.com/cityradiuschs', icon: 'fab fa-twitter' },
        { name: 'Instagram', url: 'https://instagram.com/cityradiuschs', icon: 'fab fa-instagram' },
        {
          name: 'LinkedIn',
          url: 'https://linkedin.com/company/cityradiuschs',
          icon: 'fab fa-linkedin-in',
        },
        { name: 'YouTube', url: 'https://youtube.com/cityradiuschs', icon: 'fab fa-youtube' },
      ],
      quickLinks: [
        { text: 'About Us', to: '/about' },
        { text: 'Careers', to: '/careers' },
        { text: 'News & Updates', to: '/news' },
        { text: 'Patient Resources', to: '/resources' },
        { text: 'FAQs', to: '/faqs' },
      ],
      services: [
        { text: 'Primary Care', to: '/services/primary-care' },
        { text: 'Specialty Services', to: '/services/specialty' },
        { text: 'Preventive Care', to: '/services/preventive' },
        { text: 'Emergency Services', to: '/services/emergency' },
        { text: 'Community Programs', to: '/services/community' },
      ],
    }
  },
}
</script>

<style scoped>
footer {
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
}

.router-link-active {
  color: white;
  font-weight: 500;
  position: relative;
}

.router-link-active:after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -2px;
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent, #60a5fa, transparent);
}

/* Smooth hover transitions */
a,
button {
  transition:
    color 0.25s ease,
    background-color 0.25s ease,
    transform 0.25s ease;
}

/* Animation for social icons */
@keyframes float {
  0% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-3px);
  }

  100% {
    transform: translateY(0);
  }
}

.hover-scale:hover {
  animation: float 1s ease-in-out infinite;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .grid-cols-4 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .grid-cols-4 {
    grid-template-columns: 1fr;
  }

  .flex-wrap {
    justify-content: center;
  }
}
</style>
