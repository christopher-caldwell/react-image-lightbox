import { FC } from 'react'

import type { ToolbarProps } from './Toolbar'

export const Close: FC<Props> = ({ closeLabel, isAnimating, requestClose }) => {
  return (
    <li className='ril-toolbar__item ril__toolbarItem'>
      <button // Lightbox close button
        type='button'
        key='close'
        aria-label={closeLabel}
        title={closeLabel}
        className='ril-close ril-toolbar__item__child ril__toolbarItemChild ril__builtinButton ril__closeButton'
        onClick={!isAnimating() ? requestClose : undefined} // Ignore clicks during animation
      />
    </li>
  )
}

interface Props {
  closeLabel: ToolbarProps['closeLabel']
  isAnimating: ToolbarProps['isAnimating']
  requestClose: ToolbarProps['requestClose']
}
