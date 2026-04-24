import { useRef, useState, useCallback } from 'react'

interface SwipeState {
  startX: number
  startY: number
  deltaX: number
}

interface UseSwipeOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
}

export function useSwipe(options: UseSwipeOptions) {
  const { onSwipeLeft, onSwipeRight, threshold = 50 } = options
  const stateRef = useRef<SwipeState | null>(null)
  const [isSwiping, setIsSwiping] = useState(false)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    stateRef.current = {
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      deltaX: 0,
    }
    setIsSwiping(true)
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!stateRef.current) return
    const deltaX = e.touches[0].clientX - stateRef.current.startX
    const deltaY = e.touches[0].clientY - stateRef.current.startY
    stateRef.current.deltaX = deltaX
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      setIsSwiping(true)
    }
  }, [])

  const onTouchEnd = useCallback(() => {
    if (!stateRef.current) return
    const deltaX = stateRef.current.deltaX
    if (deltaX > threshold && onSwipeRight) {
      onSwipeRight()
    } else if (deltaX < -threshold && onSwipeLeft) {
      onSwipeLeft()
    }
    stateRef.current = null
    setIsSwiping(false)
  }, [onSwipeLeft, onSwipeRight, threshold])

  return {
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
    isSwiping,
  }
}
