import type { MaybeRefOrGetter } from 'vue'
import { nextTick, onMounted, shallowRef, toValue, watchPostEffect } from 'vue'

export function useQuerySelector(query: string, isMounted?: MaybeRefOrGetter<boolean>) {
  const elements = shallowRef<HTMLElement[]>([])

  const anyContains = (element: HTMLElement | null) => {
    if (!element)
      return

    if (element.matches(query)) {
      return true
    }

    return elements.value.findIndex(container => container.contains(element)) !== -1
  }

  const findElement = async () => {
    await nextTick()
    const _elements = document.querySelectorAll(query)

    for (let index = 0; index < _elements.length; index++) {
      const element = _elements[index] as HTMLElement
      elements.value.push(element)
    }
  }

  watchPostEffect(async () => {
    if (isMounted !== undefined && !toValue(isMounted))
      return

    findElement()
  })

  onMounted(() => {
    if (isMounted === undefined)

    findElement()
  })

  return {
    elements,
    anyContains,
  }
}
