import { FC, useState } from 'react'
import { Button } from '@mui/material'
import Lightbox from '@caldwell619/react-image-lightbox/dist/indexRefactor'
import '@caldwell619/react-image-lightbox/dist/style.css'

import image1 from './images/1.jpg'
import image2 from './images/2.jpg'
import image3 from './images/3.jpg'
import image4 from './images/4.jpg'

const images = [image1, image2, image3, image4]

export const App: FC = () => {
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const movePrev = () => {
    setActiveIndex(currentIndex => {
      return (currentIndex || 0 + images.length - 1) % images.length
    })
  }
  const moveNext = () => {
    console.log('move')
    setActiveIndex(currentIndex => {
      console.log({ currentIndex, new: currentIndex + 1, passed: (currentIndex + 1) % images.length })
      return (currentIndex + 1) % images.length
    })
  }

  const activeIndexNumber = activeIndex ?? 0
  console.log('activeIndexNumber', activeIndexNumber)
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open</Button>
      <Lightbox
        isOpen={isOpen}
        mainSrc={images[activeIndexNumber]}
        nextSrc={images[(activeIndexNumber + 1) % images.length]}
        prevSrc={images[(activeIndexNumber + images.length - 1) % images.length]}
        onMovePrevRequest={movePrev}
        onMoveNextRequest={moveNext}
        onCloseRequest={() => setIsOpen(false)}
      />
    </>
  )
}
