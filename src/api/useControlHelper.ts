import { useState } from 'react'

export const useControlHelper = <TImage>(images: TImage[], getStartingIndex: number | (() => number) = 0) => {
  const startIndex = typeof getStartingIndex === 'number' ? getStartingIndex : getStartingIndex()
  const [activeIndex, setActiveIndex] = useState<number>(startIndex)
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const movePrev = () => {
    setActiveIndex(currentIndex => {
      const newIndex = currentIndex - 1
      return newIndex < 0 ? images.length - 1 : newIndex
    })
  }
  const moveNext = () => {
    setActiveIndex(currentIndex => {
      return (currentIndex + 1) % images.length
    })
  }

  const toggleOpen = () => {
    setIsOpen(isCurrentlyOpen => !isCurrentlyOpen)
  }

  return {
    activeIndex,
    setActiveIndex,
    moveNext,
    movePrev,
    isOpen,
    setIsOpen,
    toggleOpen,
    mainImage: images[activeIndex],
    nextImage: images[(activeIndex + 1) % images.length],
    prevImage: images[(activeIndex + images.length - 1) % images.length]
  }
}
