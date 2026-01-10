<script setup lang="ts">
import { DrawerContent, DrawerOverlay, DrawerPortal, DrawerRoot, DrawerTrigger } from 'vaul-vue'
import { ref } from 'vue'

const isOpen = ref(false)
const formData = ref({
  name: '',
  email: '',
  message: ''
})

function handleSubmit() {
  console.log('Form submitted:', formData.value)
  isOpen.value = false
}
</script>

<template>
  <div
    class="w-screen h-screen bg-white p-8 flex justify-center items-center"
    data-vaul-drawer-wrapper=""
  >
    <DrawerRoot v-model:open="isOpen">
      <DrawerTrigger as-child>
        <button class="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold shadow-lg hover:bg-blue-700 transition-colors">
          Open Form Drawer
        </button>
      </DrawerTrigger>
      <DrawerPortal>
        <DrawerOverlay class="fixed inset-0 bg-black/40" />
        <DrawerContent
          class="bg-white flex flex-col rounded-t-[20px] h-[96%] fixed bottom-0 left-0 right-0 shadow-2xl transition-transform"
        >
          <div class="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-300 mt-4 mb-2" />
          
          <div class="flex-1 overflow-y-auto p-6">
            <div class="max-w-md mx-auto">
              <h2 class="text-2xl font-bold mb-6 text-zinc-900 text-center">Contact Us</h2>
              
              <form @submit.prevent="handleSubmit" class="space-y-6">
                <div class="space-y-2">
                  <label for="name" class="block text-sm font-medium text-zinc-700">Full Name</label>
                  <input 
                    id="name"
                    v-model="formData.name"
                    type="text" 
                    placeholder="John Doe"
                    class="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div class="space-y-2">
                  <label for="email" class="block text-sm font-medium text-zinc-700">Email Address</label>
                  <input 
                    id="email"
                    v-model="formData.email"
                    type="email" 
                    placeholder="john@example.com"
                    class="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div class="space-y-2">
                  <label for="message" class="block text-sm font-medium text-zinc-700">Message</label>
                  <textarea 
                    id="message"
                    v-model="formData.message"
                    rows="4"
                    placeholder="How can we help you?"
                    class="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  ></textarea>
                </div>

                <div class="pt-4">
                  <button 
                    type="submit"
                    class="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors"
                  >
                    Send Message
                  </button>
                </div>

                <!-- Spacing at the bottom to ensure we can scroll even with keyboard -->
                <div class="h-32"></div>
              </form>
            </div>
          </div>
        </DrawerContent>
      </DrawerPortal>
    </DrawerRoot>
  </div>
</template>
