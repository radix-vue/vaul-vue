import type { ComponentPublicInstance, MaybeRefOrGetter } from 'vue'
import { unrefElement, useElementSize } from '@vueuse/core'
import {  shallowRef, watch } from 'vue'

export function useElement(target: MaybeRefOrGetter<ComponentPublicInstance | undefined>) {
  const element = shallowRef<HTMLElement | SVGElement>()

  const {
    height,
    width,
  } = useElementSize(element)

  watch(
    () => unrefElement(target),
    (el) => {
      if (!el)
        return

      element.value = el
    }
  )

  return {
    height,
    width,
    element,
  }
}
