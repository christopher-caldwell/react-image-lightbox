import { FC } from 'react'

export const ErrorImage: FC<ErrorImageProps> = ({ imageClass, imageStyle, imageLoadErrorMessage }) => {
  return (
    <div className={`${imageClass} ril__image ril-errored`} style={imageStyle}>
      <div className='ril__errorContainer'>{imageLoadErrorMessage}</div>
    </div>
  )
}

export const FallbackImage: FC<FallbackImageProps> = ({ imageClass, imageStyle, loadingIcon }) => {
  return (
    <div className={`${imageClass} ril__image ril-not-loaded`} style={imageStyle}>
      <div className='ril__loadingContainer'>{loadingIcon}</div>
    </div>
  )
}

export const DiscourageDownloadImage: FC<DiscourageDownloadImageProps> = ({
  imageClass,
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
    >
      <div className='ril-download-blocker ril__downloadBlocker' />
    </div>
  )
}

export const Image: FC<ImageProps> = ({
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
  alt: React.ImgHTMLAttributes<HTMLImageElement>['alt']
}

interface ErrorImageProps {
  imageClass: string
  imageStyle: React.CSSProperties
  imageLoadErrorMessage?: React.ReactNode
}

interface FallbackImageProps {
  imageClass: string
  imageStyle: React.CSSProperties
  loadingIcon: React.ReactNode
}

interface DiscourageDownloadImageProps {
  imageClass: string
  imageStyle: React.CSSProperties
  onDoubleClick: React.MouseEventHandler<HTMLDivElement>
  onWheel: React.WheelEventHandler<HTMLImageElement>
}
