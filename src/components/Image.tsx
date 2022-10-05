import { FC } from 'react'

export const ErrorImage: FC<ErrorImageProps> = ({ imageClass, imageStyle, imageLoadErrorMessage, key }) => {
  return (
    <div className={`${imageClass} ril__image ril-errored`} style={imageStyle} key={key}>
      <div className='ril__errorContainer'>{imageLoadErrorMessage}</div>
    </div>
  )
}

export const FallbackImage: FC<FallbackImageProps> = ({ imageClass, imageStyle, key, loadingIcon }) => {
  return (
    <div className={`${imageClass} ril__image ril-not-loaded`} style={imageStyle} key={key}>
      <div className='ril__loadingContainer'>{loadingIcon}</div>
    </div>
  )
}

export const DiscourageDownloadImage: FC<DiscourageDownloadImageProps> = ({
  imageClass,
  key,
  imageStyle,
  onDoubleClick,
  onWheel
}) => {
  return (
    <div
      className={`${imageClass} ril__image ril__imageDiscourager`}
      onDoubleClick={onDoubleClick}
      onWheel={onWheel}
      style={imageStyle}
      key={key}
    >
      <div className='ril-download-blocker ril__downloadBlocker' />
    </div>
  )
}

export const Image: FC<ImageProps> = ({
  key,
  alt,
  imageSrc,
  imageStyle,
  imageCrossOrigin,
  imageClass,
  onDoubleClick,
  onWheel
}) => {
  return (
    <img
      {...(imageCrossOrigin ? { crossOrigin: imageCrossOrigin } : {})}
      className={`${imageClass} ril__image`}
      onDoubleClick={onDoubleClick}
      onWheel={onWheel}
      style={imageStyle}
      src={imageSrc}
      key={key}
      alt={alt}
      draggable={false}
    />
  )
}

interface ImageProps {
  imageCrossOrigin?: React.ImgHTMLAttributes<HTMLImageElement>['crossOrigin']
  imageClass: string
  imageStyle: React.CSSProperties
  onDoubleClick: React.MouseEventHandler<HTMLDivElement>
  onWheel: React.WheelEventHandler<HTMLImageElement>
  imageSrc: string
  key?: React.Key | null | undefined
  alt: React.ImgHTMLAttributes<HTMLImageElement>['alt']
}

interface ErrorImageProps {
  imageClass: string
  imageStyle: React.CSSProperties
  imageLoadErrorMessage?: React.ReactNode
  key?: React.Key | null | undefined
}

interface FallbackImageProps {
  imageClass: string
  imageStyle: React.CSSProperties
  loadingIcon: React.ReactNode
  key?: React.Key | null | undefined
}

interface DiscourageDownloadImageProps {
  key?: React.Key | null | undefined
  imageClass: string
  imageStyle: React.CSSProperties
  onDoubleClick: React.MouseEventHandler<HTMLDivElement>
  onWheel: React.WheelEventHandler<HTMLImageElement>
}
