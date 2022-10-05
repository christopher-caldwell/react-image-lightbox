import { FC } from 'react'

export const FallbackLoader: FC = () => {
  return (
    <div className='ril-loading-circle ril__loadingCircle ril__loadingContainer__icon'>
      {[...new Array(12)].map((_, index) => (
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          className='ril-loading-circle-point ril__loadingCirclePoint'
        />
      ))}
    </div>
  )
}
