import type { MaybeRefOrGetter, ModelRef } from 'vue'
import { computed, toValue } from 'vue'
import { getClosestNumber } from '../utils'

export interface useSnapPointsProps {
  snapPoints: MaybeRefOrGetter<number[]>
  contentSize: MaybeRefOrGetter<number>
  windowSize: MaybeRefOrGetter<number>
  offset: MaybeRefOrGetter<number>
  modelValueSnapIndex: ModelRef<number>
}

export function useSnapPoints({
  snapPoints,
  contentSize,
  windowSize,
  offset,
  modelValueSnapIndex,
}: useSnapPointsProps) {
  const drawerVisibleSize = computed(
    () => toValue(windowSize) - Math.abs(toValue(offset)),
  )

  const points = computed(() => {
    const _snapPoints = toValue(snapPoints)

    if (_snapPoints.length < 1) {
      const _contentSize = toValue(contentSize)
      return [toValue(_contentSize) / toValue(windowSize)]
    }

    return _snapPoints.sort()
  })

  const closestSnapPoint = computed(() => {
    const _points = toValue(points)

    if (_points.length <= 1)
      return _points[0]

    const offsetNormalized = drawerVisibleSize.value / toValue(windowSize)

    return getClosestNumber(points.value, offsetNormalized)
  })

  const closestSnapPointIndex = computed(
    () => points.value.findIndex(point => point === closestSnapPoint.value),
  )

  const activeSnapPointOffset = computed(() => {
    const point = points.value[modelValueSnapIndex.value]

    if (point === undefined) {
      console.error('Snap point not found')
      return 0
    }

    const wSize = toValue(windowSize)
    return wSize - (wSize * point)
  })

  const shouldDismiss = computed(() => {
    const div = 2
    const wSize = toValue(windowSize)

    const smallestPoint = points.value[0] / div

    return drawerVisibleSize.value < wSize * smallestPoint
  })

  return {
    points,
    activeSnapPointOffset,
    closestSnapPointIndex,
    shouldDismiss,
    drawerVisibleSize,
  }
}
