import { FC, LegacyRef } from 'react'

import { MAX_ZOOM_LEVEL, MIN_ZOOM_LEVEL } from '../constant'

export const ZoomControl: FC<Props> = ({
  zoomLabel,
  zoomButton,
  isAnimating,
  zoomLevel,
  handleZoomButtonClick,
  type
}) => {
  const isZoomingIn = type === 'in'
  const zoomLimit = isZoomingIn ? MAX_ZOOM_LEVEL : MIN_ZOOM_LEVEL

  return (
    <li className='ril-toolbar__item ril__toolbarItem'>
      <button
        type='button'
        key={`zoom-${type}`}
        aria-label={zoomLabel}
        title={zoomLabel}
        className={[
          `ril-zoom-${type}`,
          'ril__toolbarItemChild',
          'ril__builtinButton',
          isZoomingIn ? 'ril__zoomInButton' : 'ril__zoomOutButton',
          ...(zoomLevel === zoomLimit ? ['ril__builtinButtonDisabled'] : [])
        ].join(' ')}
        ref={zoomButton}
        disabled={isAnimating() || zoomLevel === zoomLimit}
        onClick={!isAnimating() && zoomLevel !== zoomLimit ? handleZoomButtonClick : undefined}
      />
    </li>
  )
}

interface Props {
  zoomLabel?: string
  handleZoomButtonClick?: () => void
  isAnimating: () => boolean
  zoomButton: LegacyRef<HTMLButtonElement> | undefined
  zoomLevel: number
  type: 'out' | 'in'
}
