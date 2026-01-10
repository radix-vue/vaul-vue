import { onMounted, onUnmounted, ref, type Ref, type ComponentPublicInstance, watch } from 'vue'
import { WINDOW_TOP_OFFSET } from './constants'
import { isMobileFirefox } from './browser'

// HTML input types that do not cause the software keyboard to appear.
const nonTextInputTypes = new Set([
  'checkbox',
  'radio',
  'range',
  'color',
  'file',
  'image',
  'button',
  'submit',
  'reset',
])

export function isInput(target: Element): target is HTMLInputElement | HTMLTextAreaElement {
  return (
    (target instanceof HTMLInputElement && !nonTextInputTypes.has(target.type))
    || target instanceof HTMLTextAreaElement
    || (target instanceof HTMLElement && target.isContentEditable)
  )
}

export interface UseKeyboardHandlerOptions {
  isOpen: Ref<boolean>
  drawerRef: Ref<ComponentPublicInstance | null>
  snapPoints: Ref<(number | string)[] | undefined>
  snapPointsOffset: Ref<number[]>
  activeSnapPointIndex: Ref<number | undefined>
  fixed: Ref<boolean | undefined>
  direction: Ref<'top' | 'bottom' | 'left' | 'right'>
  repositionInputs?: Ref<boolean>
}

export function useKeyboardHandler(options: UseKeyboardHandlerOptions) {
  const {
    isOpen,
    drawerRef,
    snapPoints,
    snapPointsOffset,
    activeSnapPointIndex,
    fixed,
    direction,
    repositionInputs = ref(true),
  } = options

  const keyboardIsOpen = ref(false)
  const previousDiffFromInitial = ref(0)
  const initialDrawerHeight = ref(0)

  function getDrawerElement(): HTMLElement | null {
    return drawerRef.value?.$el ?? null
  }

  function onVisualViewportChange() {
    const drawerEl = getDrawerElement()
    if (!drawerEl || !repositionInputs.value) return

    // Only apply for bottom direction
    if (direction.value !== 'bottom') return

    const focusedElement = document.activeElement as HTMLElement
    if (isInput(focusedElement) || keyboardIsOpen.value) {
      const visualViewportHeight = window.visualViewport?.height || 0
      const totalHeight = window.innerHeight
      
      // This is the height of the keyboard
      let diffFromInitial = totalHeight - visualViewportHeight
      const drawerHeight = drawerEl.getBoundingClientRect().height || 0
      
      // Adjust drawer height only if it's tall enough
      const isTallEnough = drawerHeight > totalHeight * 0.8

      if (!initialDrawerHeight.value) {
        initialDrawerHeight.value = drawerHeight
      }

      const offsetFromTop = drawerEl.getBoundingClientRect().top

      // visualViewport height may change due to some subtle changes to the keyboard. 
      // Checking if the height changed by 60 or more will make sure that the keyboard really changed its open state.
      if (Math.abs(previousDiffFromInitial.value - diffFromInitial) > 60) {
        keyboardIsOpen.value = !keyboardIsOpen.value
      }

      if (snapPoints.value && snapPoints.value.length > 0 && snapPointsOffset.value && activeSnapPointIndex.value !== undefined) {
        const activeSnapPointHeight = snapPointsOffset.value[activeSnapPointIndex.value] || 0
        diffFromInitial += activeSnapPointHeight
      }
      
      previousDiffFromInitial.value = diffFromInitial

      // We don't have to change the height if the input is in view
      // When we are here we are in the opened keyboard state so we can correctly check if the input is in view
      if (drawerHeight > visualViewportHeight || keyboardIsOpen.value) {
        const height = drawerEl.getBoundingClientRect().height
        let newDrawerHeight = height

        if (height > visualViewportHeight) {
          newDrawerHeight = visualViewportHeight - (isTallEnough ? offsetFromTop : WINDOW_TOP_OFFSET)
        }

        // When fixed, don't move the drawer upwards if there's space, 
        // but rather only change its height so it's fully scrollable when the keyboard is open
        if (fixed.value) {
          drawerEl.style.height = `${height - Math.max(diffFromInitial, 0)}px`
        } else {
          drawerEl.style.height = `${Math.max(newDrawerHeight, visualViewportHeight - offsetFromTop)}px`
        }
      } else if (!isMobileFirefox()) {
        drawerEl.style.height = `${initialDrawerHeight.value}px`
      }

      if (snapPoints.value && snapPoints.value.length > 0 && !keyboardIsOpen.value) {
        drawerEl.style.bottom = `0px`
      } else {
        // Negative bottom value would never make sense
        drawerEl.style.bottom = `${Math.max(diffFromInitial, 0)}px`
      }
    }
  }

  function resetHeight() {
    const drawerEl = getDrawerElement()
    if (!drawerEl) return
    
    drawerEl.style.height = ''
    drawerEl.style.bottom = ''
    initialDrawerHeight.value = 0
    previousDiffFromInitial.value = 0
    keyboardIsOpen.value = false
  }

  onMounted(() => {
    window.visualViewport?.addEventListener('resize', onVisualViewportChange)
  })

  onUnmounted(() => {
    window.visualViewport?.removeEventListener('resize', onVisualViewportChange)
  })

  // Reset when drawer is closed
  watch(isOpen, (open) => {
    if (!open) {
      resetHeight()
    }
  })

  return {
    keyboardIsOpen,
  }
}
