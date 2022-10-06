# React Image Lightbox

<p align="center">
  <h6/>
  <img src="https://img.shields.io/npm/v/@caldwell619/react-image-lightbox">
  <img src="https://img.shields.io/bundlephobia/min/@caldwell619/react-image-lightbox">
  <img src="https://img.shields.io/github/last-commit/christopher-caldwell/react-image-lightbox">
  <img src="https://img.shields.io/npm/types/@caldwell619/react-image-lightbox">
</p>

Forked from [react-image-lightbox](https://github.com/frontend-collective/react-image-lightbox).

A flexible lightbox component for displaying images in a React project.

[Demo](https://christopher-caldwell.github.io/react-image-lightbox/)

## Why Fork?

The main reason is that the original seems to not be maintained anymore. The last commit was [July 2021](https://github.com/frontend-collective/react-image-lightbox), and many of the issues are stale.

Some other issues:

- Didn't have TypeScript types.
- Class based, which isn't an issue itself, but more about the enhancement. It was all in one file, 1500 lines.
- Dragging an image caused a console error about preventing the default on the event.
- Demo was class based.
- Using React Modal incorrectly. They recommend to keep it mounted, the og library has you conditionally render it.
  - This is slightly opinionated, but `react-modal` should be a peer dependency to avoid version conflicts if you also use it.

## Features

- Keyboard shortcuts (with rate limiting)
- Image Zoom
- Flexible rendering using src values assigned on the fly
- Image preloading for smoother viewing
- Mobile friendly, with pinch to zoom and swipe (Thanks, [@webcarrot](https://github.com/webcarrot)!)

## Example

Pseudo code to get your started. See [the demo](./demo/src/App.tsx) for a full example.

```tsx
import { Lightbox } from '@caldwell619/react-image-lightbox'
// This only needs to be imported once in your app
import '@caldwell619/react-image-lightbox/dist/style.css'

const images: string[] = [...]

const App = () => {
  // Define logic handlers and state

  return (
    <Lightbox
      isOpen={isOpen}
      mainSrc={images[0]}
      // ...rest props
    />
  )
}
```

### Logic Helpers

For convenience, there is a set of logical helpers you can use for next and previous functionality.

```tsx
import { Lightbox, useControlHelper } from '@caldwell619/react-image-lightbox'
const App = () => {
  const { activeIndex, isOpen, toggleOpen, moveNext, movePrev, nextImage, prevImage, mainImage } =
    useControlHelper(images)

  return (
    <Lightbox
      isOpen={isOpen}
      mainSrc={mainImage}
      nextSrc={nextImage}
      prevSrc={prevImage}
      onMovePrevRequest={movePrev}
      onMoveNextRequest={moveNext}
      onCloseRequest={toggleOpen}
    />
  )
}
```

## Props

Full, yet **WIP** [list of props](./docs/props.md)

## Contributing

WIP guide [here](./docs/CONTRIBUTING.md)

## License

MIT
