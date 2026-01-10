<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { DialogContent } from 'reka-ui'
import { injectDrawerRootContext } from './context'
import { useScaleBackground } from './useScaleBackground'
import { useKeyboardHandler } from './useKeyboardHandler'

const {
  isOpen,
  snapPointsOffset,
  hasSnapPoints,
  drawerRef,
  onPress,
  onDrag,
  onRelease,
  modal,
  emitOpenChange,
  dismissible,
  direction,
  handleOnly,
  snapPoints,
  activeSnapPointIndex,
  fixed,
  repositionInputs,
} = injectDrawerRootContext()

useScaleBackground()

// Use the keyboard handler for repositioning when virtual keyboard appears
const { keyboardIsOpen } = useKeyboardHandler({
  isOpen,
  drawerRef,
  snapPoints,
  snapPointsOffset,
  activeSnapPointIndex: computed(() => activeSnapPointIndex.value ?? undefined),
  fixed,
  direction,
  repositionInputs,
})

const delayedSnapPoints = ref(false)

const snapPointHeight = computed(() => {
  if (snapPointsOffset.value && snapPointsOffset.value.length > 0)
    return `${snapPointsOffset.value[0]}px`

  return '0'
})

function handlePointerDownOutside(event: Event) {
  if (!modal.value || event.defaultPrevented) {
    event.preventDefault()
    return
  }
  if (keyboardIsOpen.value) {
    // Blur active element to close keyboard first
    const activeEl = document.activeElement as HTMLElement
    if (activeEl && typeof activeEl.blur === 'function') {
      activeEl.blur()
    }
    return
  }

  if (dismissible.value) {
    emitOpenChange(false)
  }
  else {
    event.preventDefault()
  }
}

function handlePointerDown(event: PointerEvent) {
  if (handleOnly.value)
    return

  onPress(event)
}

function handleOnDrag(event: PointerEvent) {
  if (handleOnly.value)
    return

  onDrag(event)
}

watchEffect (() => {
  if (hasSnapPoints.value) {
    window.requestAnimationFrame(() => {
      delayedSnapPoints.value = true
    })
  }
})
</script>

<template>
  <DialogContent
    ref="drawerRef"
    data-vaul-drawer=""
    :data-vaul-drawer-direction="direction"
    :data-vaul-delayed-snap-points="delayedSnapPoints ? 'true' : 'false'"
    :data-vaul-snap-points="isOpen && hasSnapPoints ? 'true' : 'false'"
    :data-vaul-keyboard-open="keyboardIsOpen ? 'true' : 'false'"
    :style="{ '--snap-point-height': snapPointHeight }"
    @pointerdown="handlePointerDown"
    @pointermove="handleOnDrag"
    @pointerup="onRelease"
    @pointer-down-outside="handlePointerDownOutside"
    @open-auto-focus.prevent
    @escape-key-down="(event) => {
      if (!dismissible)
        event.preventDefault()
    }"
  >
    <slot />
  </DialogContent>
</template>
