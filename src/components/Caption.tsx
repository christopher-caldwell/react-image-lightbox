import { FC, LegacyRef, ReactNode, WheelEventHandler } from 'react'

export const Caption: FC<Props> = ({ imageCaption, handleCaptionMousewheel, captionRef }) => {
  return (
    <div
      onWheel={handleCaptionMousewheel}
      onMouseDown={event => event.stopPropagation()}
      className='ril-caption ril__caption'
      ref={captionRef}
    >
      <div className='ril-caption-content ril__captionContent'>{imageCaption}</div>
    </div>
  )
}

interface Props {
  handleCaptionMousewheel: WheelEventHandler<HTMLDivElement>
  captionRef: LegacyRef<HTMLDivElement> | undefined
  imageCaption: ReactNode
}
