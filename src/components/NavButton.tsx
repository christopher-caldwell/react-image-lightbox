import { FC, MouseEventHandler } from 'react'

export const NavButton: FC<Props> = ({ direction, requestMove, isAnimating, label }) => {
  return (
    <button // Move to next image button
      type='button'
      className={`ril-next-button ril__navButtons ril__navButton${direction}`}
      key='next'
      aria-label={label}
      title={label}
      onClick={!isAnimating() ? requestMove : undefined} // Ignore clicks during animation
    />
  )
}

interface Props {
  direction: 'Prev' | 'Next'
  label: string
  isAnimating: () => boolean
  requestMove: MouseEventHandler<HTMLButtonElement>
}
