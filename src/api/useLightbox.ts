import { createRef, useState, useRef, useEffect, useCallback } from 'react'
import Modal, { Props as ModalProps } from 'react-modal'
import { getWindowWidth, getWindowHeight, getHighestSafeWindowContext } from '../util'

import {
  ACTION_MOVE,
  ACTION_NONE,
  ACTION_PINCH,
  ACTION_SWIPE,
  KEYS,
  MAX_ZOOM_LEVEL,
  MIN_SWIPE_DISTANCE,
  MIN_ZOOM_LEVEL,
  SOURCE_ANY,
  SOURCE_MOUSE,
  SOURCE_POINTER,
  SOURCE_TOUCH,
  WHEEL_MOVE_X_THRESHOLD,
  WHEEL_MOVE_Y_THRESHOLD,
  ZOOM_BUTTON_INCREMENT_SIZE,
  ZOOM_RATIO
} from '../constant'

const isTargetMatchImage = (target: React.TouchEvent<HTMLDivElement>['target']) => {
  //@ts-expect-error FIXME
  return target && /ril-image-current/.test(target.className)
}

const parseMouseEvent = (mouseEvent: React.MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
  return {
    id: 'mouse',
    source: SOURCE_MOUSE,
    //@ts-expect-error FIXME Figure out why this being parsed
    x: parseInt(mouseEvent.clientX, 10),
    //@ts-expect-error FIXME Figure out why this being parsed
    y: parseInt(mouseEvent.clientY, 10)
  }
}

const parseTouchPointer = (touchPointer: React.TouchEvent<HTMLDivElement>) => {
  return {
    // @ts-expect-error FIXME idk
    id: touchPointer.identifier,
    source: SOURCE_TOUCH,
    //@ts-expect-error FIXME Figure out why this being parse
    x: parseInt(touchPointer.clientX, 10),
    //@ts-expect-error FIXME Figure out why this being parse
    y: parseInt(touchPointer.clientY, 10)
  }
}

const parsePointerEvent = (pointerEvent: any) => {
  return {
    id: pointerEvent.pointerId,
    source: SOURCE_POINTER,
    x: parseInt(pointerEvent.clientX, 10),
    y: parseInt(pointerEvent.clientY, 10)
  }
}

const getTransform = ({ x = 0, y = 0, zoom = 1, width, targetWidth }: any) => {
  let nextX = x
  const windowWidth = getWindowWidth()
  if (width > windowWidth) {
    nextX += (windowWidth - width) / 2
  }
  const scaleFactor = zoom * (targetWidth / width)

  return {
    transform: `translate3d(${nextX}px,${y}px,0) scale3d(${scaleFactor},${scaleFactor},1)`
  }
}

// All of the prevent defaults are commented on passive listeners. They seem to be serving no purpose and are erroring in a console.

export const useLightbox = (props: OwnProps) => {
  const { animationDisabled, enableZoom, imagePadding = 0 } = props
  const forceUpdate = useForceUpdate()

  const [isClosing, setIsClosing] = useState<boolean>(!!animationDisabled)
  const [shouldAnimate, setShouldAnimate] = useState<boolean>(false)
  const [zoomLevel, setZoomLevel] = useState<number>(MIN_ZOOM_LEVEL)
  const [offsetX, setOffsetX] = useState<number>(0)
  const [offsetY, setOffsetY] = useState<number>(0)
  const [loadErrorStatus, setLoadErrorStatus] = useState<Record<string, boolean>>({})

  const outerEl = createRef<HTMLDivElement>()
  const zoomInBtn = createRef<HTMLButtonElement>()
  const zoomOutBtn = createRef<HTMLButtonElement>()
  const caption = createRef<HTMLDivElement>()

  // Timeouts - always clear it before umount
  const timeouts = useRef<NodeJS.Timeout[]>([])

  // Current action
  const currentAction = useRef<number>(ACTION_NONE)

  // Events source
  const eventsSource = useRef<number>(SOURCE_ANY)

  // Empty pointers list
  const pointerList = useRef<Pointer[]>([])

  // Prevent inner close
  const preventInnerClose = useRef<boolean>(false)
  const preventInnerCloseTimeout = useRef<NodeJS.Timeout | null>(null)

  // Used to disable animation when changing props.mainSrc|nextSrc|prevSrc
  const keyPressed = useRef<boolean>(false)

  // Used to store load state / dimensions of images
  const imageCache = useRef<Record<string, { loaded: boolean; height: number; width: number }>>({})

  // Time the last keydown event was called (used in keyboard action rate limiting)
  const lastKeyDownTime = useRef(0)

  // Used for debouncing window resize event
  const resizeTimeout = useRef<NodeJS.Timeout | null>(null)

  const listeners = useRef<any>({})

  // Used to determine when actions are triggered by the scroll wheel
  const wheelActionTimeout = useRef<NodeJS.Timeout | null>(null)
  const resetScrollTimeout = useRef<NodeJS.Timeout | null>(null)
  const scrollX = useRef<number>(0)
  const scrollY = useRef<number>(0)

  // Used in panning zoomed images
  const moveStartX = useRef<number>(0)
  const moveStartY = useRef<number>(0)
  const moveStartOffsetX = useRef<number>(0)
  const moveStartOffsetY = useRef<number>(0)

  // Used to swipe
  const swipeStartX = useRef<number>(0)
  const swipeStartY = useRef<number>(0)
  const swipeEndX = useRef<number>(0)
  const swipeEndY = useRef<number>(0)

  // Used to pinch
  const pinchTouchList = useRef<Pointer[] | null>(null)
  const pinchDistance = useRef<number>(0)

  // Used to differentiate between images with identical src
  const keyCounter = useRef<number>(0)

  // Used to detect a move when all src's remain unchanged (four or more of the same image in a row)
  const moveRequested = useRef<boolean>(false)
  const didUnmount = useRef<boolean>(false)

  const prevProps = useRef<OwnProps>(props)

  const windowContext = useRef<Window>()

  /**  Load image from src and call callback with image width and height on load */
  const loadImage = useCallback(
    (srcType: string, imageSrc: string, done: (err?: any) => void) => {
      // Return the image info if it is already cached
      if (isImageLoaded(imageSrc)) {
        _setTimeout(() => {
          done()
        }, 1)
        return
      }

      const inMemoryImage = new global.Image()

      if (props.imageCrossOrigin) {
        inMemoryImage.crossOrigin = props.imageCrossOrigin
      }

      inMemoryImage.onerror = (errorEvent: any) => {
        props.onImageLoadError?.(imageSrc, srcType, errorEvent)

        // failed to load so set the state loadErrorStatus
        setLoadErrorStatus(prevState => ({
          ...prevState,
          [srcType]: true
        }))

        done(errorEvent)
      }

      inMemoryImage.onload = () => {
        props.onImageLoad?.(imageSrc, srcType, inMemoryImage)

        imageCache.current[imageSrc] = {
          loaded: true,
          width: inMemoryImage.width,
          height: inMemoryImage.height
        }

        done()
      }

      inMemoryImage.src = imageSrc
    },
    [props]
  )

  // Load all images and their thumbnails
  const loadAllImages = useCallback(
    (_props = props) => {
      const generateLoadDoneCallback = (srcType: string, imageSrc: string) => (err?: any) => {
        // Give up showing image on error
        if (err) {
          return
        }

        // Don't rerender if the src is not the same as when the load started
        // or if the component has unmounted
        //@ts-expect-error FIXME JS-y
        if (props[srcType] !== imageSrc || didUnmount.current) {
          return
        }

        // Force rerender with the new image
        forceUpdate()
      }

      // Load the images
      getSrcTypes().forEach(srcType => {
        const type = srcType.name
        //@ts-expect-error FIXME JS-y
        const propsType = _props[type] as string | undefined

        // there is no error when we try to load it initially
        if (propsType && loadErrorStatus[type]) {
          setLoadErrorStatus(prevState => ({
            ...prevState,
            [type]: false
          }))
        }

        // Load unloaded images
        if (propsType && !isImageLoaded(propsType)) {
          loadImage(type, propsType, generateLoadDoneCallback(type, propsType))
        }
      })
    },
    [forceUpdate, loadErrorStatus, loadImage, props]
  )

  useEffect(() => {
    let sourcesChanged = false
    const prevSrcDict = {}
    const nextSrcDict = {}
    getSrcTypes().forEach(srcType => {
      //@ts-expect-error FIXME too JS-y
      if (prevProps[srcType.name] !== props[srcType.name]) {
        sourcesChanged = true

        // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        prevSrcDict[prevProps[srcType.name]] = true
        // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        nextSrcDict[props[srcType.name]] = true
      }
    })

    if (sourcesChanged || moveRequested.current) {
      // Reset the loaded state for images not rendered next
      Object.keys(prevSrcDict).forEach(prevSrc => {
        if (!(prevSrc in nextSrcDict) && prevSrc in imageCache.current) {
          imageCache.current[prevSrc].loaded = false
        }
      })

      moveRequested.current = false

      // Load any new images
      loadAllImages(props)
    }
    prevProps.current = props
  }, [props, loadAllImages])

  // useEffect(() => {
  //   const listenersCurrent = listeners.current
  //   return () => {
  //     didUnmount.current = true
  //     Object.keys(listenersCurrent).forEach(type => {
  //       windowContext.current?.removeEventListener(type, listenersCurrent[type])
  //     })
  //     timeouts.current.forEach(tid => clearTimeout(tid))
  //   }
  // })

  const _setTimeout = (func: () => void, time?: number) => {
    const id = setTimeout(() => {
      timeouts.current = timeouts.current.filter(tid => tid !== id)
      func()
    }, time)
    timeouts.current.push(id)
    return id
  }

  /** Detach key and mouse input events */
  const isAnimating = useCallback(() => {
    return shouldAnimate || isClosing
  }, [isClosing, shouldAnimate])

  const _clearTimeout = (id: NodeJS.Timeout | null) => {
    timeouts.current = timeouts.current.filter(tid => tid !== id)
    if (!id) return
    clearTimeout(id)
  }

  const setPreventInnerClose = useCallback(() => {
    if (preventInnerCloseTimeout.current) {
      _clearTimeout(preventInnerCloseTimeout.current)
    }
    preventInnerClose.current = true
    preventInnerCloseTimeout.current = _setTimeout(() => {
      preventInnerClose.current = false
      preventInnerCloseTimeout.current = null
    }, 100)
  }, [])

  /**
   * Get the size of the lightbox in pixels
   */
  const getLightboxRect = useCallback(() => {
    if (outerEl.current) {
      return outerEl.current.getBoundingClientRect()
    }

    return {
      width: getWindowWidth(),
      height: getWindowHeight(),
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    }
  }, [outerEl])

  /**  Get sizing for when an image is larger than the window */
  const getFitSizes = useCallback(
    (width: number, height: number, stretch?: boolean) => {
      const boxSize = getLightboxRect()
      let maxHeight = boxSize.height - imagePadding * 2
      let maxWidth = boxSize.width - imagePadding * 2

      if (!stretch) {
        maxHeight = Math.min(maxHeight, height)
        maxWidth = Math.min(maxWidth, width)
      }

      const maxRatio = maxWidth / maxHeight
      const srcRatio = width / height

      if (maxRatio > srcRatio) {
        // height is the constraining dimension of the photo
        return {
          width: (width * maxHeight) / height,
          height: maxHeight
        }
      }

      return {
        width: maxWidth,
        height: (height * maxWidth) / width
      }
    },
    [getLightboxRect, imagePadding]
  )

  // Get image src types
  const getSrcTypes = () => {
    return [
      {
        name: 'mainSrc',
        keyEnding: `i${keyCounter.current}`
      },
      {
        name: 'mainSrcThumbnail',
        keyEnding: `t${keyCounter.current}`
      },
      {
        name: 'nextSrc',
        keyEnding: `i${keyCounter.current + 1}`
      },
      {
        name: 'nextSrcThumbnail',
        keyEnding: `t${keyCounter.current + 1}`
      },
      {
        name: 'prevSrc',
        keyEnding: `i${keyCounter.current - 1}`
      },
      {
        name: 'prevSrcThumbnail',
        keyEnding: `t${keyCounter.current - 1}`
      }
    ]
  }

  const isImageLoaded = (imageSrc: string) => {
    return imageSrc && imageSrc in imageCache.current && imageCache.current[imageSrc].loaded
  }

  /**
   * Get sizing when the image is scaled
   */
  const getZoomMultiplier = useCallback(
    (newZoomLevel = zoomLevel) => {
      return ZOOM_RATIO ** newZoomLevel
    },
    [zoomLevel]
  )

  const handleKeyInput: NonNullable<React.DOMAttributes<HTMLDivElement>['onKeyUp']> = event => {
    event.stopPropagation()

    // Ignore key input during animations
    if (isAnimating()) {
      return
    }

    // Allow slightly faster navigation through the images when user presses keys repeatedly
    if (event.type === 'keyup') {
      //@ts-expect-error FIXME Need to figure out how to type default props
      lastKeyDownTime.current -= props.keyRepeatKeyupBonus
      return
    }

    const keyCode = event.which || event.keyCode

    // Ignore key presses that happen too close to each other (when rapid fire key pressing or holding down the key)
    // But allow it if it's a lightbox closing action
    const currentTime = new Date()
    //@ts-expect-error FIXME Need to figure out how to type default props
    if (currentTime.getTime() - lastKeyDownTime.current < props.keyRepeatLimit && keyCode !== KEYS.ESC) {
      return
    }
    lastKeyDownTime.current = currentTime.getTime()

    switch (keyCode) {
      // ESC key closes the lightbox
      case KEYS.ESC:
        // event.preventDefault()
        requestClose?.(event)
        break

      // Left arrow key moves to previous image
      case KEYS.LEFT_ARROW:
        if (!props.prevSrc) {
          return
        }

        // event.preventDefault()
        keyPressed.current = true
        requestMovePrev(event)
        break

      // Right arrow key moves to next image
      case KEYS.RIGHT_ARROW:
        if (!props.nextSrc) {
          return
        }

        // event.preventDefault()
        keyPressed.current = true
        requestMoveNext(event)
        break

      default:
    }
  }

  const calculatePinchDistance = (coordinates = pinchTouchList.current) => {
    if (!coordinates) throw new Error('Cannot find coordinates')
    const [a, b] = coordinates
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
  }

  const calculatePinchCenter = (pointer = pinchTouchList.current) => {
    if (!pointer) throw new Error('Pointer is null')
    const [a, b] = pointer
    return {
      x: a.x - (a.x - b.x) / 2,
      y: a.y - (a.y - b.y) / 2
    }
  }

  const handlePinchStart = useCallback(
    (pointerList: Pointer[]) => {
      if (!props.enableZoom) {
        return
      }
      currentAction.current = ACTION_PINCH
      pinchTouchList.current = pointerList.map(({ id, x, y }) => ({ id, x, y }))
      pinchDistance.current = calculatePinchDistance()
    },
    [props.enableZoom]
  )

  const handlePinchEnd = () => {
    currentAction.current = ACTION_NONE
    pinchTouchList.current = null
    pinchDistance.current = 0
  }

  // Handle the window resize event TODO: FIXME
  const handleWindowResize = useCallback(() => {
    _clearTimeout(resizeTimeout.current)
    // OLD
    // this.resizeTimeout = this.setTimeout(this.forceUpdate.bind(this), 100)
    resizeTimeout.current = _setTimeout(() => forceUpdate(), 100)
  }, [forceUpdate])

  const handleZoomInButtonClick = () => {
    const nextZoomLevel = zoomLevel + ZOOM_BUTTON_INCREMENT_SIZE
    changeZoom(nextZoomLevel)
    if (nextZoomLevel === MAX_ZOOM_LEVEL) {
      zoomOutBtn.current?.focus()
    }
  }

  const handleZoomOutButtonClick = () => {
    const nextZoomLevel = zoomLevel - ZOOM_BUTTON_INCREMENT_SIZE
    changeZoom(nextZoomLevel)
    if (nextZoomLevel === MIN_ZOOM_LEVEL) {
      zoomInBtn.current?.focus()
    }
  }

  const handleCaptionMousewheel = (event: any) => {
    event.stopPropagation()

    if (!caption.current) {
      return
    }

    const { height } = caption?.current.getBoundingClientRect()
    const { scrollHeight, scrollTop } = caption.current
    if ((event.deltaY > 0 && height + scrollTop >= scrollHeight) || (event.deltaY < 0 && scrollTop <= 0)) {
      event.preventDefault()
    }
  }

  /**
   * Handle a mouse wheel event over the lightbox container
   */
  const handleOuterMousewheel: React.WheelEventHandler<HTMLDivElement> = event => {
    // Prevent scrolling of the background
    event.stopPropagation()

    const xThreshold = WHEEL_MOVE_X_THRESHOLD
    let actionDelay = 0
    const imageMoveDelay = 500

    _clearTimeout(resetScrollTimeout.current)
    resetScrollTimeout.current = _setTimeout(() => {
      scrollX.current = 0
      scrollY.current = 0
    }, 300)

    // Prevent rapid-fire zoom behavior
    if (wheelActionTimeout.current !== null || isAnimating()) {
      return
    }

    if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) {
      // handle horizontal scrolls with image moves
      scrollY.current = 0
      scrollX.current += event.deltaX

      const bigLeapX = xThreshold / 2
      // If the scroll amount has accumulated sufficiently, or a large leap was taken
      if (scrollX.current >= xThreshold || event.deltaX >= bigLeapX) {
        // Scroll right moves to next
        requestMoveNext(event)
        actionDelay = imageMoveDelay
        scrollX.current = 0
      } else if (scrollX.current <= -1 * xThreshold || event.deltaX <= -1 * bigLeapX) {
        // Scroll left moves to previous
        requestMovePrev(event)
        actionDelay = imageMoveDelay
        scrollX.current = 0
      }
    }

    // Allow successive actions after the set delay
    if (actionDelay !== 0) {
      wheelActionTimeout.current = _setTimeout(() => {
        wheelActionTimeout.current = null
      }, actionDelay)
    }
  }

  const handleImageMouseWheel: React.WheelEventHandler<HTMLImageElement> = event => {
    const yThreshold = WHEEL_MOVE_Y_THRESHOLD

    if (Math.abs(event.deltaY) >= Math.abs(event.deltaX)) {
      event.stopPropagation()
      // If the vertical scroll amount was large enough, perform a zoom
      if (Math.abs(event.deltaY) < yThreshold) {
        return
      }

      scrollX.current = 0
      scrollY.current += event.deltaY

      changeZoom(zoomLevel - event.deltaY, event.clientX, event.clientY)
    }
  }

  /**
   * Handle a double click on the current image
   */
  const handleImageDoubleClick: React.MouseEventHandler<HTMLDivElement> = event => {
    if (zoomLevel > MIN_ZOOM_LEVEL) {
      // A double click when zoomed in zooms all the way out
      changeZoom(MIN_ZOOM_LEVEL, event.clientX, event.clientY)
    } else {
      // A double click when zoomed all the way out zooms in
      changeZoom(zoomLevel + ZOOM_BUTTON_INCREMENT_SIZE, event.clientX, event.clientY)
    }
  }

  const filterPointersBySource = () => {
    pointerList.current = pointerList.current.filter(({ source }) => source === eventsSource.current)
  }

  const shouldHandleEvent = useCallback((source: number) => {
    if (eventsSource.current === source) {
      return true
    }
    if (eventsSource.current === SOURCE_ANY) {
      eventsSource.current = source
      return true
    }
    switch (source) {
      case SOURCE_MOUSE:
        return false
      case SOURCE_TOUCH:
        eventsSource.current = SOURCE_TOUCH
        filterPointersBySource()
        return true
      case SOURCE_POINTER:
        if (eventsSource.current === SOURCE_MOUSE) {
          eventsSource.current = SOURCE_POINTER
          filterPointersBySource()
          return true
        }
        return false
      default:
        return false
    }
  }, [])

  const addPointer = (pointer: Pointer) => {
    pointerList.current.push(pointer)
  }

  const removePointer = (pointer: Pointer) => {
    pointerList.current = pointerList.current.filter(({ id }: any) => id !== pointer.id)
  }

  const handleMouseDown: React.MouseEventHandler<HTMLDivElement> = event => {
    if (shouldHandleEvent(SOURCE_MOUSE) && isTargetMatchImage(event.target)) {
      addPointer(parseMouseEvent(event))
      multiPointerStart(event)
    }
  }

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = event => {
    if (shouldHandleEvent(SOURCE_MOUSE)) {
      multiPointerMove(event, [parseMouseEvent(event)])
    }
  }

  const handleTouchStart: React.TouchEventHandler<HTMLDivElement> = event => {
    if (shouldHandleEvent(SOURCE_TOUCH) && isTargetMatchImage(event.target)) {
      ;[].forEach.call(event.changedTouches, (eventTouch: any) => addPointer(parseTouchPointer(eventTouch)))
      multiPointerStart(event as unknown as React.MouseEvent<HTMLDivElement>)
    }
  }

  const handleTouchMove: NonNullable<React.DOMAttributes<HTMLDivElement>['onTouchMove']> = event => {
    if (shouldHandleEvent(SOURCE_TOUCH)) {
      multiPointerMove(
        event,
        [].map.call(event.changedTouches, (eventTouch: any) => parseTouchPointer(eventTouch))
      )
    }
  }

  // Handle move start over the lightbox container
  // This happens:
  // - On a mouseDown event
  // - On a touchstart event
  const handleMoveStart = useCallback(
    ({ x: clientX, y: clientY }: any) => {
      if (!props.enableZoom) {
        return
      }
      currentAction.current = ACTION_MOVE
      moveStartX.current = clientX
      moveStartY.current = clientY
      moveStartOffsetX.current = offsetX
      moveStartOffsetY.current = offsetY
    },
    [offsetX, offsetY, props.enableZoom]
  )

  const decideMoveOrSwipe = useCallback(
    (pointer: any) => {
      if (zoomLevel <= MIN_ZOOM_LEVEL) {
        handleSwipeStart(pointer)
      } else {
        handleMoveStart(pointer)
      }
    },
    [handleMoveStart, zoomLevel]
  )

  /** Handle dragging over the lightbox container
   This happens:
   - After a mouseDown and before a mouseUp event
  - After a touchstart and before a touchend event
   */
  const handleMove = useCallback(
    ({ x: clientX, y: clientY }: any) => {
      const newOffsetX = moveStartX.current - clientX + moveStartOffsetX.current
      const newOffsetY = moveStartY.current - clientY + moveStartOffsetY.current
      if (offsetX !== newOffsetX || offsetY !== newOffsetY) {
        setOffsetX(newOffsetX)
        setOffsetY(newOffsetY)
      }
    },
    [offsetX, offsetY]
  )

  /** Get info for the best suited image to display with the given srcType  */
  const getBestImageForType = useCallback(
    (
      srcType: string
    ): {
      src: string
      height: number
      width: number
      targetHeight?: number
      targetWidth?: number
    } | null => {
      //@ts-expect-error FIXME JS-ville
      let imageSrc = props[srcType] as string
      let fitSizes: Partial<{
        width: number
        height: number
      }> = {}

      //@ts-expect-error FIXME JS-ville
      const thumbnailImage = props[`${srcType}Thumbnail`] as string
      if (isImageLoaded(imageSrc)) {
        // Use full-size image if available

        fitSizes = getFitSizes(imageCache.current[imageSrc].width, imageCache.current[imageSrc].height)
      } else if (isImageLoaded(thumbnailImage)) {
        // Fall back to using thumbnail if the image has not been loaded
        imageSrc = thumbnailImage
        fitSizes = getFitSizes(imageCache.current[imageSrc].width, imageCache.current[imageSrc].height, true)
      } else {
        return null
      }

      return {
        src: imageSrc,
        height: imageCache.current[imageSrc].height,
        width: imageCache.current[imageSrc].width,
        targetHeight: fitSizes.height,
        targetWidth: fitSizes.width
      }
    },
    [getFitSizes, props]
  )

  const getMaxOffsets = useCallback(
    (newZoomLevel = zoomLevel) => {
      const currentImageInfo = getBestImageForType('mainSrc')
      if (currentImageInfo === null) {
        return { maxX: 0, minX: 0, maxY: 0, minY: 0 }
      }

      const boxSize = getLightboxRect()
      const zoomMultiplier = getZoomMultiplier(newZoomLevel)

      let maxX = 0
      if (zoomMultiplier * currentImageInfo.width - boxSize.width < 0) {
        // if there is still blank space in the X dimension, don't limit except to the opposite edge
        maxX = (boxSize.width - zoomMultiplier * currentImageInfo.width) / 2
      } else {
        maxX = (zoomMultiplier * currentImageInfo.width - boxSize.width) / 2
      }

      let maxY = 0
      if (zoomMultiplier * currentImageInfo.height - boxSize.height < 0) {
        // if there is still blank space in the Y dimension, don't limit except to the opposite edge
        maxY = (boxSize.height - zoomMultiplier * currentImageInfo.height) / 2
      } else {
        maxY = (zoomMultiplier * currentImageInfo.height - boxSize.height) / 2
      }

      return {
        maxX,
        maxY,
        minX: -1 * maxX,
        minY: -1 * maxY
      }
    },
    [getBestImageForType, getLightboxRect, getZoomMultiplier, zoomLevel]
  )

  const changeZoom = useCallback(
    (newZoomLevel: number, clientX?: number, clientY?: number) => {
      // Ignore if zoom disabled
      if (!enableZoom) {
        return
      }

      // Constrain zoom level to the set bounds
      const nextZoomLevel = Math.max(MIN_ZOOM_LEVEL, Math.min(MAX_ZOOM_LEVEL, newZoomLevel))

      // Ignore requests that don't change the zoom level
      if (nextZoomLevel === zoomLevel) {
        return
      }

      if (nextZoomLevel === MIN_ZOOM_LEVEL) {
        // Snap back to center if zoomed all the way out
        setZoomLevel(newZoomLevel)
        setOffsetX(0)
        setOffsetY(0)
        return
      }

      const imageBaseSize = getBestImageForType('mainSrc')
      if (imageBaseSize === null) {
        return
      }

      const currentZoomMultiplier = getZoomMultiplier()
      const nextZoomMultiplier = getZoomMultiplier(nextZoomLevel)

      // Default to the center of the image to zoom when no mouse position specified
      const boxRect = getLightboxRect()
      const pointerX = typeof clientX !== 'undefined' ? clientX - boxRect.left : boxRect.width / 2
      const pointerY = typeof clientY !== 'undefined' ? clientY - boxRect.top : boxRect.height / 2

      const currentImageOffsetX = (boxRect.width - imageBaseSize.width * currentZoomMultiplier) / 2
      const currentImageOffsetY = (boxRect.height - imageBaseSize.height * currentZoomMultiplier) / 2

      const currentImageRealOffsetX = currentImageOffsetX - offsetX
      const currentImageRealOffsetY = currentImageOffsetY - offsetY

      const currentPointerXRelativeToImage = (pointerX - currentImageRealOffsetX) / currentZoomMultiplier
      const currentPointerYRelativeToImage = (pointerY - currentImageRealOffsetY) / currentZoomMultiplier

      const nextImageRealOffsetX = pointerX - currentPointerXRelativeToImage * nextZoomMultiplier
      const nextImageRealOffsetY = pointerY - currentPointerYRelativeToImage * nextZoomMultiplier

      const nextImageOffsetX = (boxRect.width - imageBaseSize.width * nextZoomMultiplier) / 2
      const nextImageOffsetY = (boxRect.height - imageBaseSize.height * nextZoomMultiplier) / 2

      let nextOffsetX = nextImageOffsetX - nextImageRealOffsetX
      let nextOffsetY = nextImageOffsetY - nextImageRealOffsetY

      // When zooming out, limit the offset so things don't get left askew
      if (currentAction.current !== ACTION_PINCH) {
        const maxOffsets = getMaxOffsets()
        if (newZoomLevel > nextZoomLevel) {
          nextOffsetX = Math.max(maxOffsets.minX, Math.min(maxOffsets.maxX, nextOffsetX))
          nextOffsetY = Math.max(maxOffsets.minY, Math.min(maxOffsets.maxY, nextOffsetY))
        }
      }

      setZoomLevel(newZoomLevel)
      setOffsetX(nextOffsetX)
      setOffsetY(nextOffsetY)
    },
    [enableZoom, getBestImageForType, getLightboxRect, getMaxOffsets, getZoomMultiplier, offsetX, offsetY, zoomLevel]
  )

  const handlePinch = useCallback(
    (pointerList: Pointer[]) => {
      if (!pinchTouchList.current) throw new Error('pinchTouchList is null')
      pinchTouchList.current = pinchTouchList.current?.map(oldPointer => {
        for (let i = 0; i < pointerList.length; i += 1) {
          if (pointerList[i].id === oldPointer.id) {
            return pointerList[i]
          }
        }

        return oldPointer
      })

      const newDistance = calculatePinchDistance()

      const newZoomLevel = zoomLevel + newDistance - pinchDistance.current

      pinchDistance.current = newDistance
      const { x: clientX, y: clientY } = calculatePinchCenter(pinchTouchList.current)
      changeZoom(newZoomLevel, clientX, clientY)
    },
    [changeZoom, zoomLevel]
  )

  const multiPointerMove = useCallback(
    (_: any, pointerList: Pointer[]) => {
      switch (currentAction.current) {
        case ACTION_MOVE: {
          // event.preventDefault()
          handleMove(pointerList[0])
          break
        }
        case ACTION_SWIPE: {
          // event.preventDefault()
          handleSwipe(pointerList[0])
          break
        }
        case ACTION_PINCH: {
          // event.preventDefault()
          handlePinch(pointerList)
          break
        }
        default:
          break
      }
    },
    [handleMove, handlePinch]
  )

  const requestMove = useCallback(
    (
      direction: 'prev' | 'next',
      event: React.KeyboardEvent<HTMLDivElement> | React.WheelEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>
    ) => {
      // Reset the zoom level on image move
      let nextZoom = MIN_ZOOM_LEVEL
      let nextOffsetX = 0
      let nextOffsetY = 0
      let nextShouldAnimate = !!props.animationDisabled

      // Enable animated states
      if (!props.animationDisabled && (!keyPressed.current || props.animationOnKeyInput)) {
        nextShouldAnimate = true
        _setTimeout(() => {
          setShouldAnimate(false)
        }, props.animationDuration)
      }
      keyPressed.current = false

      moveRequested.current = true

      setZoomLevel(nextZoom)
      setOffsetX(nextOffsetX)
      setOffsetY(nextOffsetY)
      setShouldAnimate(nextShouldAnimate)
      if (direction === 'prev') {
        keyCounter.current -= 1
        props.onMovePrevRequest?.(event)
      } else {
        keyCounter.current += 1
        props.onMoveNextRequest?.(event)
      }
    },
    [props]
  )

  /** Request that the lightbox be closed */
  const requestClose: NonNullable<ModalProps['onRequestClose']> = event => {
    // Call the parent close request
    const closeLightbox = () => props.onCloseRequest?.(event)

    if (props.animationDisabled || (event.type === 'keydown' && !props.animationOnKeyInput)) {
      // No animation
      closeLightbox()
      return
    }

    // With animation
    // Start closing animation
    setIsClosing(true)

    // Perform the actual closing at the end of the animation
    _setTimeout(closeLightbox, props.animationDuration)
  }

  const requestMoveNext = useCallback(
    (
      event: React.KeyboardEvent<HTMLDivElement> | React.WheelEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>
    ) => {
      requestMove('next', event)
    },
    [requestMove]
  )

  /** Request to transition to the previous image  */
  const requestMovePrev = useCallback(
    (
      event: React.KeyboardEvent<HTMLDivElement> | React.WheelEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>
    ) => {
      requestMove('prev', event)
    },
    [requestMove]
  )

  const handleSwipeStart = ({ x: clientX, y: clientY }: any) => {
    currentAction.current = ACTION_SWIPE
    swipeStartX.current = clientX
    swipeStartY.current = clientY
    swipeEndX.current = clientX
    swipeEndY.current = clientY
  }

  const handleSwipe = ({ x: clientX, y: clientY }: any) => {
    swipeEndX.current = clientX
    swipeEndY.current = clientY
  }

  const handleSwipeEnd = useCallback(
    (event: any) => {
      const xDiff = swipeEndX.current - swipeStartX.current
      const xDiffAbs = Math.abs(xDiff)
      const yDiffAbs = Math.abs(swipeEndY.current - swipeStartY.current)
      currentAction.current = ACTION_NONE
      swipeStartX.current = 0
      swipeStartY.current = 0
      swipeEndX.current = 0
      swipeEndY.current = 0

      if (!event || isAnimating() || xDiffAbs < yDiffAbs * 1.5) {
        return
      }

      if (xDiffAbs < MIN_SWIPE_DISTANCE) {
        const boxRect = getLightboxRect()
        if (xDiffAbs < boxRect.width / 4) {
          return
        }
      }

      if (xDiff > 0 && props.prevSrc) {
        // event.preventDefault()

        requestMovePrev(event)
      } else if (xDiff < 0 && props.nextSrc) {
        // event.preventDefault()

        requestMoveNext(event)
      }
    },
    [getLightboxRect, isAnimating, props.nextSrc, props.prevSrc, requestMoveNext, requestMovePrev]
  )

  const handleEnd = useCallback(
    (event: any) => {
      switch (currentAction.current) {
        case ACTION_MOVE:
          // @ts-expect-error TS(2554): Expected 0 arguments, but got 1.
          handleMoveEnd(event)
          break
        case ACTION_SWIPE:
          handleSwipeEnd(event)
          break
        case ACTION_PINCH:
          handlePinchEnd()
          break
        default:
          break
      }
    },
    [handleSwipeEnd]
  )

  const multiPointerEnd = useCallback(
    (event: any) => {
      if (currentAction.current !== ACTION_NONE) {
        setPreventInnerClose()
        handleEnd(event)
      }
      switch (pointerList.current.length) {
        case 0: {
          eventsSource.current = SOURCE_ANY
          break
        }
        case 1: {
          // event.preventDefault()
          decideMoveOrSwipe(pointerList.current[0])
          break
        }
        case 2: {
          // event.preventDefault()
          handlePinchStart(pointerList.current)
          break
        }
        default:
          break
      }
    },
    [decideMoveOrSwipe, handleEnd, handlePinchStart, setPreventInnerClose]
  )

  const handleMouseUp: React.MouseEventHandler<HTMLDivElement> = useCallback(
    event => {
      if (shouldHandleEvent(SOURCE_MOUSE)) {
        removePointer(parseMouseEvent(event))
        multiPointerEnd(event)
      }
    },
    [multiPointerEnd, shouldHandleEvent]
  )

  const handleTouchEnd = useCallback(
    (event: any) => {
      if (shouldHandleEvent(SOURCE_TOUCH)) {
        ;[].map.call(event.changedTouches, (touch: any) => removePointer(parseTouchPointer(touch)))
        multiPointerEnd(event)
      }
    },
    [multiPointerEnd, shouldHandleEvent]
  )

  const closeIfClickInner: React.MouseEventHandler<HTMLDivElement> = event => {
    //@ts-expect-error FIXME className is not in target
    if (!preventInnerClose.current && event.target.className.search(/\bril-inner\b/) > -1) {
      requestClose(event)
    }
  }

  const multiPointerStart: React.MouseEventHandler<HTMLDivElement> = useCallback(() => {
    handleEnd(null)
    switch (pointerList.current.length) {
      case 1: {
        // event.preventDefault()
        decideMoveOrSwipe(pointerList.current[0])
        break
      }
      case 2: {
        // event.preventDefault()
        handlePinchStart(pointerList.current)
        break
      }
      default:
        break
    }
  }, [decideMoveOrSwipe, handleEnd, handlePinchStart])

  const handlePointerEvent = useCallback(
    (event: any) => {
      if (shouldHandleEvent(SOURCE_POINTER)) {
        switch (event.type) {
          case 'pointerdown':
            if (isTargetMatchImage(event.target)) {
              addPointer(parsePointerEvent(event))
              multiPointerStart(event)
            }
            break
          case 'pointermove':
            multiPointerMove(event, [parsePointerEvent(event)])
            break
          case 'pointerup':
          case 'pointercancel':
            removePointer(parsePointerEvent(event))
            multiPointerEnd(event)
            break
          default:
            break
        }
      }
    },
    [multiPointerEnd, multiPointerMove, multiPointerStart, shouldHandleEvent]
  )

  useEffect(() => {
    if (!props.animationDisabled) {
      // Make opening animation play
      setIsClosing(false)
    }
    windowContext.current = getHighestSafeWindowContext()

    // TODO: Add listeners
    listeners.current = {
      resize: handleWindowResize,
      mouseup: handleMouseUp,
      touchend: handleTouchEnd,
      touchcancel: handleTouchEnd,
      pointerdown: handlePointerEvent,
      pointermove: handlePointerEvent,
      pointerup: handlePointerEvent,
      pointercancel: handlePointerEvent
    }

    Object.keys(listeners.current).forEach(type => {
      windowContext.current?.addEventListener(type, listeners.current[type])
    })

    loadAllImages()
  }, [props.animationDisabled, loadAllImages, handleWindowResize, handleMouseUp, handleTouchEnd, handlePointerEvent])

  return {
    zoomLevel,
    offsetX,
    offsetY,
    isClosing,
    loadErrorStatus,
    getLightboxRect,
    isAnimating,
    getSrcTypes,
    getBestImageForType,
    getTransform,
    handleImageDoubleClick,
    handleImageMouseWheel,
    getZoomMultiplier,
    requestClose,
    outerEl,
    handleOuterMousewheel,
    handleMouseDown,
    handleMouseMove,
    handleTouchStart,
    handleTouchMove,
    handleKeyInput,
    closeIfClickInner,
    zoomInBtn,
    handleZoomInButtonClick,
    zoomOutBtn,
    handleZoomOutButtonClick,
    handleCaptionMousewheel,
    caption,
    requestMovePrev,
    requestMoveNext,
    // Lifecycle
    loadAllImages,
    handleTouchEnd,
    handleMouseUp,
    handlePointerEvent,
    handlePinchEnd,
    handleWindowResize
  }
}
export type OwnProps = {
  isOpen: boolean
  mainSrc: string
  prevSrc?: string
  nextSrc?: string
  mainSrcThumbnail?: string
  prevSrcThumbnail?: string
  nextSrcThumbnail?: string
  onCloseRequest: ModalProps['onRequestClose']
  onMovePrevRequest?: (
    event: React.KeyboardEvent<HTMLDivElement> | React.WheelEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>
  ) => void
  onMoveNextRequest?: (
    event: React.KeyboardEvent<HTMLDivElement> | React.WheelEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>
  ) => void
  onImageLoadError?: (...args: any[]) => any
  onImageLoad?: (...args: any[]) => any
  onAfterOpen?: (...args: any[]) => any
  discourageDownloads?: boolean
  animationDisabled?: boolean
  animationOnKeyInput?: boolean
  animationDuration?: number
  keyRepeatLimit?: number
  keyRepeatKeyupBonus?: number
  imageTitle?: React.ReactNode
  imageCaption?: React.ReactNode
  imageCrossOrigin?: React.ImgHTMLAttributes<HTMLImageElement>['crossOrigin']
  reactModalStyle?: Modal.Styles
  imagePadding?: number
  wrapperClassName?: string
  toolbarButtons?: React.ReactNode[] | null
  clickOutsideToClose?: boolean
  enableZoom?: boolean
  reactModalProps?: {}
  nextLabel?: string
  prevLabel?: string
  zoomInLabel?: string
  zoomOutLabel?: string
  closeLabel?: string
  imageLoadErrorMessage?: React.ReactNode
  loader?: React.ReactNode
}

export type State = {
  isClosing: boolean
  /** Component parts should animate (e.g., when images are moving, or image is being zoomed) */
  shouldAnimate: boolean
  /** Zoom level of image */
  zoomLevel: number
  /** Horizontal offset from center */
  offsetX: number
  /** Vertical offset from center */
  offsetY: number
  /** image load error for srcType */
  loadErrorStatus: Record<string, boolean>
}

interface Pointer {
  id: number | string
  source?: number
  x: number
  y: number
}

const useForceUpdate = () => {
  const [_, setValue] = useState(0) //eslint-disable-line
  return () => setValue(value => value + 1)
}
