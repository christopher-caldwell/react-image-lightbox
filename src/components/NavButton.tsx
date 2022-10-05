import { FC } from 'react'

export const NavButton: FC<Props> = ({ direction, requestMove, isAnimating, label }) => {
  return (
    <button // Move to next image button
      type='button'
      className={`ril-next-button ril__navButtons ril__navButton${direction}`}
      key='next'
      aria-label={label}
      title={label}
      onClick={!isAnimating() ? e => requestMove(e as unknown as React.MouseEvent<HTMLDivElement>) : undefined} // Ignore clicks during animation
    />
  )
}

interface Props {
  direction: 'Prev' | 'Next'
  label?: string
  isAnimating: () => boolean
  requestMove: (
    event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement> | React.WheelEvent<HTMLDivElement>
  ) => void
}
