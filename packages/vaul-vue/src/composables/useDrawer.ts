import type { ComponentPublicInstance, EmitFn, MaybeRefOrGetter, ModelRef, StyleValue } from 'vue'
import type { DrawerRootEmits, DrawerRootProps } from '../types/drawer'

import { useEventListener, useWindowSize } from '@vueuse/core'
import { computed, nextTick, ref, shallowRef, toValue, watch } from 'vue'
import { dampen } from '../utils'
import { useElement } from './useElement'
import { useQuerySelector } from './useQuerySelector'
import { useScroll } from './useScroll'
import { useSnapPoints } from './useSnapPoints'
import { useStacks } from './useStacks'

export type UseDrawerProps = {
  [K in keyof DrawerRootProps]-?: MaybeRefOrGetter<NonNullable<DrawerRootProps[K]>>
}

export function useDrawer(
  props: UseDrawerProps,
  emit: EmitFn<DrawerRootEmits>,
  modelValueSnapIndex: ModelRef<number>,
  modelValueOpen: ModelRef<boolean>,
) {
  const shouldMount = ref(toValue(props.defaultOpen) || false)

  const drawerHandleRef = shallowRef<ComponentPublicInstance>()
  const drawerContentRef = shallowRef<ComponentPublicInstance>()
  const drawerOverlayRef = shallowRef<ComponentPublicInstance>()

  const pointerStart = ref(0)

  // this is the offset we use when dragging
  const offset = ref(0)

  // this is used so we can set initial offset first after mounting
  // then fading animation from there.
  const animateIn = ref(false)

  const isDragging = ref(false)
  const isPressing = ref(false)

  // this is true when the sheet is in animation,
  // closing or opening don't matter
  const inProgress = ref(false)

  const {
    height: contentHeight,
    width: contentWidth,
    element: contentElement,
  } = useElement(drawerContentRef)

  const {
    width: windowWidth,
    height: windowHeight,
  } = useWindowSize()

  const { anyContains: anyNoDragContains } = useQuerySelector('[data-vaul-no-drag]', shouldMount)

  const side = computed(() => props.side)

  const isVertical = computed(() => side.value === 'top' || side.value === 'bottom')

  // this is because, for example
  // when side is set to right. we snap drawer to the left side of the screen
  // to move it out of screen to right, we have to add windowWidth and should be positive
  // positive translateY means it goes down, position translateX means it goes right
  const sideOffsetModifier = computed(() => props.side === 'right' || props.side === 'bottom' ? 1 : -1)

  const windowSize = computed(() => isVertical.value ? windowHeight.value : windowWidth.value)
  const contentSize = computed(() => isVertical.value ? contentHeight.value : contentWidth.value)

  const {
    addStack,
    popStack,
    updateDepths,
  } = useStacks(drawerOverlayRef, isDragging, inProgress, windowSize)

  const {
    handleScroll,
    handleScrollStart,
    handleScrollEnd,
    startScroll,
  } = useScroll(shouldMount)

  const {
    points,
    activeSnapPointOffset,
    shouldDismiss,
    closestSnapPointIndex,
  } = useSnapPoints({
    snapPoints: props.snapPoints,
    contentSize,
    windowSize,
    offset,
    modelValueSnapIndex,
  })

  useEventListener(contentElement, 'transitionend', async (event) => {
    const target = event.target as Element | null

    if (!target || target !== contentElement.value)
      return

    if (modelValueOpen.value) {
      emit('opened')
    }
    else {
      shouldMount.value = false
      emit('closed')
    }

    inProgress.value = false
  })

  const offsetInitial = computed(
    () => {
      const closeOffset = windowSize.value * sideOffsetModifier.value

      if (modelValueOpen.value && !animateIn.value) {
        return closeOffset
      }

      if (modelValueOpen.value && animateIn.value) {
        return activeSnapPointOffset.value * sideOffsetModifier.value
      }

      return closeOffset
    },
  )

  const initialContainerStyle = computed(() => {
    return {
      translate: isVertical.value
        ? `0px calc(${offsetInitial.value}px + var(--vaul-inset) * ${-sideOffsetModifier.value})`
        : ` calc(${offsetInitial.value}px + var(--vaul-inset) * ${-sideOffsetModifier.value}) 0px`,

      transitionProperty: !isPressing.value && inProgress.value
        ? 'translate, transform'
        : 'none',

      transitionDuration: !isPressing.value && inProgress.value
        ? 'var(--vaul-duration)'
        : 'none',

      userSelect: isPressing.value ? 'none' : 'auto',
      touchAction: 'none',
    } satisfies StyleValue
  })

  const onDragStart = (event: PointerEvent) => {
    isPressing.value = true
    pointerStart.value = isVertical.value ? event.clientY : event.clientX

    const target = event.target as HTMLElement | null
    const currentTarget = event.currentTarget as HTMLElement | null

    if (!target || !currentTarget)
      return

    handleScrollStart(event)
    target.setPointerCapture(event.pointerId)
  }

  const onDrag = (event: PointerEvent) => {
    if (!contentElement.value || !isPressing.value || anyNoDragContains(event.target as HTMLElement))
      return

    const clientPosition = isVertical.value ? event.clientY : event.clientX

    const dragDistance = pointerStart.value - clientPosition + startScroll.value
    const movingDirectionDrawerWantsToGo = dragDistance * sideOffsetModifier.value > 0

    isDragging.value = handleScroll(event, movingDirectionDrawerWantsToGo, props.side)
    if (!isDragging.value)
      return

    let newOffset = activeSnapPointOffset.value * sideOffsetModifier.value + -dragDistance

    if ((newOffset * sideOffsetModifier.value) <= 0)
      return

    const lastPointOffset = points.value[points.value.length - 1] * windowSize.value
    const drawerVisibleSize = windowSize.value - Math.abs(newOffset)

    if (drawerVisibleSize > lastPointOffset) {
      const difference = drawerVisibleSize - lastPointOffset // difference between the drawer position and last point offset
  
      newOffset += difference * sideOffsetModifier.value // delete the difference after drawer passes last point offset
      newOffset += -dampen(Math.abs(difference)) * sideOffsetModifier.value // now that we can't pass last point offset, add dampened value to overextend little bit
    }

    offset.value = newOffset
    emit('drag', offset.value)
  }

  const onDragEnd = () => {
    isPressing.value = false

    if (!isDragging.value)
      return

    isDragging.value = false
    inProgress.value = true

    if (props.dismissible && shouldDismiss.value) {
      modelValueOpen.value = false
      return
    }

    modelValueSnapIndex.value = closestSnapPointIndex.value
    handleScrollEnd()
  }

  watch(offsetInitial, () => {
    if (!contentElement.value || !props.scaleBackground)
      return

    inProgress.value = true
    updateDepths(offsetInitial.value)
  }, {
    flush: 'post',
  })

  watch(offset, () => {
    if (!contentElement.value || offset.value === 0)
      return

    contentElement.value.style.translate = isVertical.value
      ? `0px calc(${offset.value}px + var(--vaul-inset) * ${sideOffsetModifier.value})`
      : ` calc(${offset.value}px + var(--vaul-inset) * ${sideOffsetModifier.value}) 0px`

    if (props.scaleBackground) {
      updateDepths(offset.value)
    }
  })

  watch(modelValueOpen, async () => {
    if (modelValueOpen.value) {
      shouldMount.value = true

      emit('open')
      await nextTick()

      if (contentElement.value) {
        addStack(contentElement.value)
      }

      animateIn.value = true
    }
    else {
      emit('close')
      animateIn.value = false

      popStack()
    }

    inProgress.value = true
  })

  return {
    onDragStart,
    onDrag,
    onDragEnd,
    drawerContentRef,
    drawerHandleRef,
    drawerOverlayRef,
    open,
    isDragging,
    initialContainerStyle,
    shouldMount,
    activeSnapPointOffset,
    handleOnly: toValue(props.handleOnly),
    dismissible: toValue(props.dismissible),
    keepMounted: toValue(props.keepMounted),
    side,
  }
}
