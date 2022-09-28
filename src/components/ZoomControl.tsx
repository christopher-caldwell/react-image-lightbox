import { FC } from 'react'

import { MAX_ZOOM_LEVEL, MIN_ZOOM_LEVEL } from '../constant'
import { ToolbarProps } from './Toolbar'

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
  zoomLabel?: ToolbarProps['zoomLabel']
  handleZoomButtonClick: ToolbarProps['handleZoomButtonClick']
  isAnimating: ToolbarProps['isAnimating']
  zoomButton: ToolbarProps['zoomButton']
  zoomLevel: ToolbarProps['zoomLevel']
  type: 'out' | 'in'
}
