import { FC } from 'react'
import { Button } from '@mui/material'
import { Lightbox, useControlHelper } from '@caldwell619/react-image-lightbox'
import '@caldwell619/react-image-lightbox/dist/style.css'

import image1 from './images/1.jpg'
import image2 from './images/2.jpg'
import image3 from './images/3.jpg'
import image4 from './images/4.jpg'
import { Layout } from './components'

const images = [image1, image2, image3, image4]

export const App: FC = () => {
  /** Optional helper provided to handle common usage of next and prev. You can, of course, use your own state.
   * @source https://github.com/christopher-caldwell/react-image-lightbox/blob/5-allow-usecontrolhelper-to-start-on-a-specific-image/src/api/useControlHelper.ts
   */
  const { activeIndex, setActiveIndex, isOpen, toggleOpen, moveNext, movePrev, nextImage, prevImage, mainImage } =
    useControlHelper(
      images,
      // Optional getter to start on a specific index
      () => 1
    )

  const onOpen = () => {
    setActiveIndex(Math.round(Math.random() * 3))
    toggleOpen()
  }
  return (
    <>
      <Layout>
        <Button onClick={onOpen}>Open</Button>
      </Layout>
      <Lightbox
        isOpen={isOpen}
        mainSrc={mainImage}
        nextSrc={nextImage}
        prevSrc={prevImage}
        mainSrcThumbnail={images[activeIndex]}
        nextSrcThumbnail={images[(activeIndex + 1) % images.length]}
        prevSrcThumbnail={images[(activeIndex + images.length - 1) % images.length]}
        onMovePrevRequest={movePrev}
        onMoveNextRequest={moveNext}
        onCloseRequest={toggleOpen}
      />
    </>
  )
}
