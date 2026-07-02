<script setup lang="ts">
import DemoDrawer from '@/components/DemoDrawer.vue'
import VButton from '@/components/v/Button.vue'
import { ref } from 'vue'

const snapIndex = ref(0)
</script>

<template>
  <div class="h-full gap-4 grid place-content-center" data-vaul-drawer-wrapper>
    <p>
      Active snap point

      <span data-testid="active-snap-index">
        {{ snapIndex }}
      </span>
    </p>

    <DemoDrawer
      v-model:snap-index="snapIndex"
      :snap-points="[0.5, 0.8]"
    >
      <VButton>Open Drawer</VButton>

      <template #content>
        <VButton data-testid="change-snap-index" @click="snapIndex = 1">
          Change snap index to 1
        </VButton>

        <VButton @click="snapIndex = 0">
          Change snap index to 0
        </VButton>
      </template>
    </DemoDrawer>
  </div>
</template>
