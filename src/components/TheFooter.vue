<template>
  <footer class="bg-gradient-to-b from-[#1f7465] to-[#1a6457] text-white pt-16 pb-8">
    <div class="max-w-7xl mx-auto px-6">
      <!-- Main Footer Content -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
        <!-- Brand Column -->
        <div class="space-y-6">
          <div class="flex items-center space-x-3">
            <img src="@/assets/logos/logo1.png" class="h-10" alt="City Radius CHS Logo" />
          </div>
          <p class="text-[#c1e0db] leading-relaxed">
            Providing exceptional community healthcare services with compassion and professionalism since 2005.
          </p>
          <div class="flex space-x-3 pt-2">
            <a v-for="social in socialLinks" :key="social.name" :href="social.url" target="_blank"
              class="bg-white/10 hover:bg-[#e59d50] rounded-full w-10 h-10 flex items-center justify-center transition-all duration-300 hover:scale-105"
              :aria-label="social.name">
              <i :class="social.icon + ' text-lg'"></i>
            </a>
          </div>
        </div>

        <!-- Quick Links -->
        <div>
          <h3 class="text-lg font-semibold mb-6 pb-2 border-b border-white/20 flex items-center">
            <i class="fas fa-link text-[#e59d50] mr-2"></i>
            Quick Links
          </h3>
          <ul class="space-y-4">
            <li v-for="link in quickLinks" :key="link.text">
              <router-link :to="link.to"
                class="flex items-center space-x-3 group hover:text-white transition-colors text-[#c1e0db]">
                <div class="w-2 h-2 rounded-full bg-[#e59d50] opacity-0 group-hover:opacity-100 transition-opacity">
                </div>
                <span>{{ link.text }}</span>
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Services -->
        <div>
          <h3 class="text-lg font-semibold mb-6 pb-2 border-b border-white/20 flex items-center">
            <i class="fas fa-hand-holding-medical text-[#e59d50] mr-2"></i>
            Our Services
          </h3>
          <ul class="space-y-4">
            <li v-for="service in services" :key="service.text">
              <router-link :to="service.to"
                class="flex items-center space-x-3 group hover:text-white transition-colors text-[#c1e0db]">
                <div class="w-2 h-2 rounded-full bg-[#e59d50] opacity-0 group-hover:opacity-100 transition-opacity">
                </div>
                <span>{{ service.text }}</span>
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Contact Info -->
        <div>
          <h3 class="text-lg font-semibold mb-6 pb-2 border-b border-white/20 flex items-center">
            <i class="fas fa-headset text-[#e59d50] mr-2"></i>
            Contact Us
          </h3>
          <ul class="space-y-5">
            <li class="flex items-start space-x-4">
              <div class="bg-[#e59d50]/20 p-2 rounded-full flex-shrink-0">
                <i class="fas fa-phone-alt text-[#e59d50] text-sm"></i>
              </div>
              <div>
                <p class="font-medium text-white">Phone</p>
                <a href="tel:+254700000000" class="text-[#c1e0db] hover:text-white">+254 700 000 000</a>
              </div>
            </li>
            <li class="flex items-start space-x-4">
              <div class="bg-[#e59d50]/20 p-2 rounded-full flex-shrink-0">
                <i class="fas fa-envelope text-[#e59d50] text-sm"></i>
              </div>
              <div>
                <p class="font-medium text-white">Email</p>
                <a href="mailto:info@cityradiuschs.org"
                  class="text-[#c1e0db] hover:text-white">info@cityradiuschs.org</a>
              </div>
            </li>
            <li class="flex items-start space-x-4">
              <div class="bg-[#e59d50]/20 p-2 rounded-full flex-shrink-0">
                <i class="fas fa-map-marker-alt text-[#e59d50] text-sm"></i>
              </div>
              <div>
                <p class="font-medium text-white">Location</p>
                <p class="text-[#c1e0db]">Nairobi, Kenya</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- Divider -->
      <div class="border-t border-white/10 my-8"></div>

      <!-- Bottom Footer -->
      <div class="flex flex-col md:flex-row justify-between items-center">
        <div class="mb-4 md:mb-0">
          <p class="text-sm text-[#a8d5cc]">
            &copy; {{ new Date().getFullYear() }} City Radius Community Health Service. All rights reserved.
          </p>
        </div>

        <div class="flex space-x-6">
          <router-link to="/privacy" class="text-[#a8d5cc] hover:text-white text-sm transition-colors">
            Privacy Policy
          </router-link>
          <router-link to="/terms" class="text-[#a8d5cc] hover:text-white text-sm transition-colors">
            Terms of Service
          </router-link>
          <router-link to="/accessibility" class="text-[#a8d5cc] hover:text-white text-sm transition-colors">
            Accessibility
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
        { name: 'LinkedIn', url: 'https://linkedin.com/company/cityradiuschs', icon: 'fab fa-linkedin-in' }
      ],
      quickLinks: [
        { text: 'About Us', to: '/about' },
        { text: 'Careers', to: '/careers' },
        { text: 'News & Updates', to: '/news' },
        { text: 'Patient Resources', to: '/resources' },
        { text: 'FAQs', to: '/faqs' }
      ],
      services: [
        { text: 'Primary Care', to: '/services/primary-care' },
        { text: 'Specialty Services', to: '/services/specialty' },
        { text: 'Preventive Care', to: '/services/preventive' },
        { text: 'Emergency Services', to: '/services/emergency' },
        { text: 'Community Programs', to: '/services/community' }
      ]
    }
  }
}
</script>

<style scoped>
footer {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
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
  background: linear-gradient(90deg, transparent, #e59d50, transparent);
}

/* Smooth hover transitions */
a,
button {
  transition: color 0.25s ease, background-color 0.25s ease, transform 0.25s ease;
}

.hover-scale:hover {
  transform: translateY(-2px);
}

/* Custom scrollbar for footer (if needed) */
footer::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

footer::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

footer::-webkit-scrollbar-thumb {
  background: #e59d50;
  border-radius: 3px;
}
</style>
