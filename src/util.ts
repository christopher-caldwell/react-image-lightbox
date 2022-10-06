import { OwnProps } from './api/useLightbox'

/**
 * Placeholder for future translate functionality
 */
export function translate(str: string, replaceStrings?: Record<string, string>) {
  if (!str) {
    return ''
  }

  let translated = str
  if (replaceStrings) {
    Object.keys(replaceStrings).forEach(placeholder => {
      translated = translated.replace(placeholder, replaceStrings[placeholder])
    })
  }

  return translated
}

export function getWindowWidth() {
  return typeof global.window !== 'undefined' ? global.window.innerWidth : 0
}

export function getWindowHeight() {
  return typeof global.window !== 'undefined' ? global.window.innerHeight : 0
}

const isCrossOriginFrame = () => {
  try {
    return global.window.location.hostname !== global.window.parent.location.hostname
  } catch (e) {
    return true
  }
}

// Get the highest window context that isn't cross-origin
// (When in an iframe)

export function getHighestSafeWindowContext(self = global.window.self): Window {
  // If we reached the top level, return self
  if (self === global.window.top) {
    return self
  }

  // If parent is the same origin, we can move up one context
  // Reference: https://stackoverflow.com/a/21965342/1601953
  if (!isCrossOriginFrame()) {
    // @ts-expect-error
    return getHighestSafeWindowContext(self.parent)
  }

  // If a different origin, we consider the current level
  // as the top reachable one
  return self
}

const defaultProps: Partial<OwnProps> = {
  imageTitle: null,
  imageCaption: null,
  toolbarButtons: null,
  reactModalProps: {},
  animationDisabled: false,
  animationDuration: 300,
  animationOnKeyInput: false,
  clickOutsideToClose: true,
  closeLabel: 'Close lightbox',
  discourageDownloads: false,
  enableZoom: true,
  imagePadding: 10,
  keyRepeatKeyupBonus: 40,
  keyRepeatLimit: 180,
  nextLabel: 'Next image',
  onAfterOpen: () => {},
  onImageLoadError: () => {},
  onImageLoad: () => {},
  onMoveNextRequest: () => {},
  onMovePrevRequest: () => {},
  prevLabel: 'Previous image',
  reactModalStyle: {},
  wrapperClassName: '',
  zoomInLabel: 'Zoom in',
  zoomOutLabel: 'Zoom out',
  imageLoadErrorMessage: 'This image failed to load',
  loader: undefined
}

export const mergePropsWithDefault = (props: OwnProps): OwnProps => {
  const mutableProps: Record<string, unknown> = { ...props }
  Object.entries(defaultProps).forEach(([key, prop]) => {
    if (!mutableProps[key as keyof OwnProps]) {
      mutableProps[key as keyof OwnProps] = prop
    }
  })
  return mutableProps as OwnProps
}
