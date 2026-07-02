import type { ComponentPublicInstance, MaybeRefOrGetter } from 'vue'
import type { DrawerSide } from '../types/drawer'
import { computed, shallowRef, toValue, watch } from 'vue'
import { range } from '../utils'
import { useElement } from './useElement'
import { useQuerySelector } from './useQuerySelector'

const drawerStack = shallowRef<(HTMLElement | SVGElement)[]>([])

export function useStacks(
  overlayRef: MaybeRefOrGetter<ComponentPublicInstance | undefined>,
  isDragging: MaybeRefOrGetter<boolean>,
  inProgress: MaybeRefOrGetter<boolean>,
  windowSize: MaybeRefOrGetter<number>,
) {
  const { element: overlayElement } = useElement(overlayRef)
  const { elements: wrapperElements } = useQuerySelector('[data-vaul-drawer-wrapper]')

  const drawerWrapperRef = computed(() => wrapperElements.value[0] as HTMLElement | undefined)

  const updateDrawerOffsets = () => {
    if (drawerStack.value.length < 1)
      return

    const drawerCounts = {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    }

    for (let index = 0; index < drawerStack.value.length; index++) {
      const element = drawerStack.value[index]

      const side = element.getAttribute('data-vaul-drawer-side') as DrawerSide | undefined
      if (!side)
        continue

      drawerCounts[side] += 1
    }

    const offsets = {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    }

    for (let index = 0; index < drawerStack.value.length; index++) {
      const element = drawerStack.value[index]

      const side = element.getAttribute('data-vaul-drawer-side') as DrawerSide | undefined
      if (!side)
        continue

      const diff = drawerCounts[side] - offsets[side] - 1
      const yOff = diff * 20 * (side === 'right' || side === 'bottom' ? -1 : 1)

      element.style.transform = `scale(${1 - (diff * 0.05)}) translate3d(0px, ${yOff}px, 0px)`
      element.style.transitionDuration = 'var(--vaul-duration)'
      element.style.transitionProperty = 'transform'

      // element.addEventListener('transitionend', () => {
      //   element.style.transitionDuration = ''
      //   element.style.transitionProperty = ''
      // }, { once: true })

      offsets[side] += 1
    }
  }

  const updateDepths = async (_offset: number) => {
    const _windowSize = toValue(windowSize)

    document.body.style.backgroundColor = drawerStack.value.length < 1 ? '' : 'black'

    if (drawerStack.value.length > 1 || (drawerStack.value.length === 1 && _windowSize === Math.abs(_offset))) {
      return
    }

    const visibleSize = _windowSize - Math.abs(_offset)
    const scale = range(0, _windowSize, 1, 0.95, visibleSize)
    const borderRadius = range(0, _windowSize, 0, 14, visibleSize)

    if (overlayElement.value) {
      overlayElement.value.style.opacity = range(0, _windowSize, 0, 1, visibleSize).toString()
    }

    let cssText = ''
    if (!toValue(isDragging) && toValue(inProgress)) {
      cssText += `
        transition-easing-function: var(--vaul-easing);
        transition-duration: var(--vaul-duration);
      `
    }

    if (drawerWrapperRef.value) {
      drawerWrapperRef.value.style.cssText = `
        ${cssText}
        transform: scale(${scale}) translate3d(0px, 0px, 0px);
        border-radius: ${borderRadius.toFixed(0)}px;
      `
    }
  }

  const addStack = (element: HTMLElement | SVGElement) => {
    drawerStack.value.push(element)
    updateDrawerOffsets()
  }

  const popStack = () => {
    drawerStack.value.pop()
    updateDrawerOffsets()
  }

  watch(() => toValue(inProgress), (_inProgress) => {
    if (_inProgress)
      return

    if (drawerWrapperRef.value) {
      drawerWrapperRef.value.style.transitionDuration = ''
    }
  })

  return {
    addStack,
    popStack,
    updateDepths,
  }
}
