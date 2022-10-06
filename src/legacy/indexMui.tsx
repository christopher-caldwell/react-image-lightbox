// Non functional WIP to improve using swipeable views

import { FC, useState } from 'react'
import { Dialog, styled, IconButton } from '@mui/material'
import RightArrow from '@mui/icons-material/ChevronRight'
import LeftArrow from '@mui/icons-material/ChevronLeft'
import SwipeableViews from 'react-swipeable-views'
import shouldForwardProp from '@emotion/is-prop-valid'

export const Lightbox: FC<Props> = ({ isOpen, srcSet, initialActiveIndex = 0, onClose }) => {
  const [activeIndex, setActiveIndex] = useState(initialActiveIndex)

  return (
    <NoScrollBarDialog maxWidth={false} open={isOpen} PaperComponent={TransparentPaper} onClose={onClose}>
      <SwipeableViews index={activeIndex} onChangeIndex={index => setActiveIndex(index)}>
        {srcSet.map((src, index) => (
          <>
            <ImageWrapper>
              <Image src={src} alt='main' key={src + index} />
              <ArrowButton position='left' size='large'>
                <LeftArrow fontSize='large' />
              </ArrowButton>
              <ArrowButton position='right' size='large'>
                <RightArrow fontSize='large' />
              </ArrowButton>
            </ImageWrapper>
          </>
        ))}
      </SwipeableViews>
    </NoScrollBarDialog>
  )
}

interface Props {
  isOpen: boolean
  onClose: () => void
  srcSet: string[]
  initialActiveIndex?: number
}

const ArrowButton = styled(IconButton, { shouldForwardProp })<{ position: 'right' | 'left' }>`
  position: absolute;
  z-index: 10000;
  color: white;
  // ${({ position }) => position}: 36%;
  ${({ position }) => position}: 0;
  height: 10vh;
  outline: none;
  border-radius: 10px;
  padding: 10px;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.15);
`

const NoScrollBarDialog = styled(Dialog)`
  & *::-webkit-scrollbar {
    display: none;
  }
`
const ImageWrapper = styled('div')`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  max-height: 100vh;
  max-width: 100%;
  width: 100%;
  position: relative;
`
const Image = styled('img')`
  max-height: 90vh;
  object-fit: contain;
  overflow: hidden;
`
const TransparentPaper = styled('div')`
  background-color: none !important;
  display: flex;
  justify-content: center;
  align-items: center;
`
