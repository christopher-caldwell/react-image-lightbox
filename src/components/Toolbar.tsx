import { FC, LegacyRef, MouseEventHandler } from 'react'

import { Close } from './Close'
import { ZoomControl } from './ZoomControl'

export const Toolbar: FC<ToolbarProps> = ({
  toolbarButtons,
  enableZoom,
  imageTitle,
  isAnimating,
  zoomLevel,
  zoomInButton,
  zoomOutButton,
  zoomInLabel,
  zoomOutLabel,
  handleZoomInButtonClick,
  handleZoomOutButtonClick,
  closeLabel,
  requestClose
}) => {
  return (
    <div // Lightbox toolbar
      className='ril-toolbar ril__toolbar'
    >
      <ul className='ril-toolbar-left ril__toolbarSide ril__toolbarLeftSide'>
        <li className='ril-toolbar__item ril__toolbarItem'>
          <span className='ril-toolbar__item__child ril__toolbarItemChild'>{imageTitle}</span>
        </li>
      </ul>

      <ul className='ril-toolbar-right ril__toolbarSide ril__toolbarRightSide'>
        {toolbarButtons
          ? toolbarButtons.map((button, i) => (
              <li key={`button_${i + 1}`} className='ril-toolbar__item ril__toolbarItem'>
                {button}
              </li>
            ))
          : null}

        {enableZoom ? (
          <>
            <ZoomControl
              zoomButton={zoomInButton}
              zoomLevel={zoomLevel}
              zoomLabel={zoomInLabel}
              isAnimating={isAnimating}
              handleZoomButtonClick={handleZoomInButtonClick}
              type='in'
            />
            <ZoomControl
              zoomButton={zoomOutButton}
              zoomLevel={zoomLevel}
              zoomLabel={zoomOutLabel}
              isAnimating={isAnimating}
              handleZoomButtonClick={handleZoomOutButtonClick}
              type='out'
            />
          </>
        ) : null}
        <Close closeLabel={closeLabel} isAnimating={isAnimating} requestClose={requestClose} />
      </ul>
    </div>
  )
}

export interface ToolbarProps {
  toolbarButtons?: JSX.Element[]
  imageTitle?: string
  enableZoom: boolean
  closeLabel: string
  isAnimating: () => boolean
  requestClose: MouseEventHandler<HTMLButtonElement>
  zoomInLabel?: string
  zoomOutLabel?: string
  handleZoomInButtonClick?: () => void
  handleZoomOutButtonClick?: () => void
  zoomOutButton: LegacyRef<HTMLButtonElement> | undefined
  zoomInButton: LegacyRef<HTMLButtonElement> | undefined
  zoomLevel: number
}
