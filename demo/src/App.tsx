import { FC, useState } from 'react'
import { Button } from '@mui/material'
import Lightbox from '@caldwell619/react-image-lightbox'
import '@caldwell619/react-image-lightbox/dist/style.css'

import image1 from './images/1.jpg'
import image2 from './images/2.jpg'
import image3 from './images/3.jpg'
import image4 from './images/4.jpg'

const images = [image1, image2, image3, image4]

export const App: FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const activePhoto = images[activeIndex || 0]
  const fullUrl = activePhoto || ''

  const prevIndex = activeIndex !== null ? activeIndex - 1 : undefined
  const nextIndex = activeIndex !== null ? activeIndex + 1 : undefined
  const prevSrc = prevIndex ? images[prevIndex] : undefined
  const nextSrc = nextIndex ? images[nextIndex] : undefined

  const onPhotoNavigate = (direction: 'back' | 'forward') => {
    setActiveIndex(currentIndex => (currentIndex + direction === 'back' ? -1 : 1))
  }

  console.log({ fullUrl, prevSrc, nextSrc })

  return (
    <>
      <Button onClick={() => setActiveIndex(0)}>Open</Button>
      {activeIndex !== null ? (
        <Lightbox
          mainSrc={fullUrl}
          nextSrc={nextSrc}
          prevSrc={prevSrc}
          onCloseRequest={() => setActiveIndex(null)}
          onMovePrevRequest={() => onPhotoNavigate('back')}
          onMoveNextRequest={() => onPhotoNavigate('forward')}
        />
      ) : null}
    </>
  )
}
