export const useLightbox = () => {
  const _setTimeout = (func: any, time: any) => {
    const id = setTimeout(() => {
      this.timeouts = this.timeouts.filter((tid: any) => tid !== id)
      func()
    }, time)
    this.timeouts.push(id)
    return id
  }

  const setPreventInnerClose = () => {
    if (this.preventInnerCloseTimeout) {
      this.clearTimeout(this.preventInnerCloseTimeout)
    }
    this.preventInnerClose = true
    this.preventInnerCloseTimeout = this.setTimeout(() => {
      this.preventInnerClose = false
      this.preventInnerCloseTimeout = null
    }, 100)
  }

  // Get info for the best suited image to display with the given srcType
  const getBestImageForType = (srcType: any) => {
    let imageSrc = this.props[srcType]
    let fitSizes = {}

    if (this.isImageLoaded(imageSrc)) {
      // Use full-size image if available
      // @ts-expect-error TS(2554): Expected 3 arguments, but got 2.
      fitSizes = this.getFitSizes(this.imageCache[imageSrc].width, this.imageCache[imageSrc].height)
    } else if (this.isImageLoaded(this.props[`${srcType}Thumbnail`])) {
      // Fall back to using thumbnail if the image has not been loaded
      imageSrc = this.props[`${srcType}Thumbnail`]
      fitSizes = this.getFitSizes(this.imageCache[imageSrc].width, this.imageCache[imageSrc].height, true)
    } else {
      return null
    }

    return {
      src: imageSrc,
      height: this.imageCache[imageSrc].height,
      width: this.imageCache[imageSrc].width,
      targetHeight: (fitSizes as any).height,
      targetWidth: (fitSizes as any).width
    }
  }

  // Get sizing for when an image is larger than the window
  const getFitSizes = (width: any, height: any, stretch: any) => {
    const boxSize = this.getLightboxRect()
    let maxHeight = boxSize.height - this.props.imagePadding * 2
    let maxWidth = boxSize.width - this.props.imagePadding * 2

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
  }

  const getMaxOffsets = (zoomLevel = this.state.zoomLevel) => {
    const currentImageInfo = this.getBestImageForType('mainSrc')
    if (currentImageInfo === null) {
      return { maxX: 0, minX: 0, maxY: 0, minY: 0 }
    }

    const boxSize = this.getLightboxRect()
    const zoomMultiplier = this.getZoomMultiplier(zoomLevel)

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
  }

  // Get image src types
  const getSrcTypes = () => {
    return [
      {
        name: 'mainSrc',
        keyEnding: `i${this.keyCounter}`
      },
      {
        name: 'mainSrcThumbnail',
        keyEnding: `t${this.keyCounter}`
      },
      {
        name: 'nextSrc',
        keyEnding: `i${this.keyCounter + 1}`
      },
      {
        name: 'nextSrcThumbnail',
        keyEnding: `t${this.keyCounter + 1}`
      },
      {
        name: 'prevSrc',
        keyEnding: `i${this.keyCounter - 1}`
      },
      {
        name: 'prevSrcThumbnail',
        keyEnding: `t${this.keyCounter - 1}`
      }
    ]
  }

  /**
   * Get sizing when the image is scaled
   */
  const getZoomMultiplier = (zoomLevel = this.state.zoomLevel) => {
    return ZOOM_RATIO ** zoomLevel
  }

  /**
   * Get the size of the lightbox in pixels
   */
  const getLightboxRect = () => {
    if (this.outerEl.current) {
      return this.outerEl.current.getBoundingClientRect()
    }

    return {
      width: getWindowWidth(),
      height: getWindowHeight(),
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    }
  }

  const _clearTimeout = (id: any) => {
    this.timeouts = this.timeouts.filter((tid: any) => tid !== id)
    clearTimeout(id)
  }

  // Change zoom level
  const changeZoom = (zoomLevel: any, clientX: any, clientY: any) => {
    // Ignore if zoom disabled
    if (!this.props.enableZoom) {
      return
    }

    // Constrain zoom level to the set bounds
    const nextZoomLevel = Math.max(MIN_ZOOM_LEVEL, Math.min(MAX_ZOOM_LEVEL, zoomLevel))

    // Ignore requests that don't change the zoom level
    if (nextZoomLevel === this.state.zoomLevel) {
      return
    }

    if (nextZoomLevel === MIN_ZOOM_LEVEL) {
      // Snap back to center if zoomed all the way out
      this.setState({
        zoomLevel: nextZoomLevel,
        offsetX: 0,
        offsetY: 0
      })

      return
    }

    const imageBaseSize = this.getBestImageForType('mainSrc')
    if (imageBaseSize === null) {
      return
    }

    const currentZoomMultiplier = this.getZoomMultiplier()
    const nextZoomMultiplier = this.getZoomMultiplier(nextZoomLevel)

    // Default to the center of the image to zoom when no mouse position specified
    const boxRect = this.getLightboxRect()
    const pointerX = typeof clientX !== 'undefined' ? clientX - boxRect.left : boxRect.width / 2
    const pointerY = typeof clientY !== 'undefined' ? clientY - boxRect.top : boxRect.height / 2

    const currentImageOffsetX = (boxRect.width - imageBaseSize.width * currentZoomMultiplier) / 2
    const currentImageOffsetY = (boxRect.height - imageBaseSize.height * currentZoomMultiplier) / 2

    const currentImageRealOffsetX = currentImageOffsetX - this.state.offsetX
    const currentImageRealOffsetY = currentImageOffsetY - this.state.offsetY

    const currentPointerXRelativeToImage = (pointerX - currentImageRealOffsetX) / currentZoomMultiplier
    const currentPointerYRelativeToImage = (pointerY - currentImageRealOffsetY) / currentZoomMultiplier

    const nextImageRealOffsetX = pointerX - currentPointerXRelativeToImage * nextZoomMultiplier
    const nextImageRealOffsetY = pointerY - currentPointerYRelativeToImage * nextZoomMultiplier

    const nextImageOffsetX = (boxRect.width - imageBaseSize.width * nextZoomMultiplier) / 2
    const nextImageOffsetY = (boxRect.height - imageBaseSize.height * nextZoomMultiplier) / 2

    let nextOffsetX = nextImageOffsetX - nextImageRealOffsetX
    let nextOffsetY = nextImageOffsetY - nextImageRealOffsetY

    // When zooming out, limit the offset so things don't get left askew
    if (this.currentAction !== ACTION_PINCH) {
      const maxOffsets = this.getMaxOffsets()
      if (this.state.zoomLevel > nextZoomLevel) {
        nextOffsetX = Math.max(maxOffsets.minX, Math.min(maxOffsets.maxX, nextOffsetX))
        nextOffsetY = Math.max(maxOffsets.minY, Math.min(maxOffsets.maxY, nextOffsetY))
      }
    }

    this.setState({
      zoomLevel: nextZoomLevel,
      offsetX: nextOffsetX,
      offsetY: nextOffsetY
    })
  }

  const closeIfClickInner = (event: any) => {
    if (!this.preventInnerClose && event.target.className.search(/\bril-inner\b/) > -1) {
      this.requestClose(event)
    }
  }

  /**
   * Handle user keyboard actions
   */
  const handleKeyInput = (event: any) => {
    event.stopPropagation()

    // Ignore key input during animations
    if (this.isAnimating()) {
      return
    }

    // Allow slightly faster navigation through the images when user presses keys repeatedly
    if (event.type === 'keyup') {
      this.lastKeyDownTime -= this.props.keyRepeatKeyupBonus
      return
    }

    const keyCode = event.which || event.keyCode

    // Ignore key presses that happen too close to each other (when rapid fire key pressing or holding down the key)
    // But allow it if it's a lightbox closing action
    const currentTime = new Date()
    if (currentTime.getTime() - this.lastKeyDownTime < this.props.keyRepeatLimit && keyCode !== KEYS.ESC) {
      return
    }
    this.lastKeyDownTime = currentTime.getTime()

    switch (keyCode) {
      // ESC key closes the lightbox
      case KEYS.ESC:
        event.preventDefault()
        this.requestClose(event)
        break

      // Left arrow key moves to previous image
      case KEYS.LEFT_ARROW:
        if (!this.props.prevSrc) {
          return
        }

        event.preventDefault()
        this.keyPressed = true
        this.requestMovePrev(event)
        break

      // Right arrow key moves to next image
      case KEYS.RIGHT_ARROW:
        if (!this.props.nextSrc) {
          return
        }

        event.preventDefault()
        this.keyPressed = true
        this.requestMoveNext(event)
        break

      default:
    }
  }

  /**
   * Handle a mouse wheel event over the lightbox container
   */
  const handleOuterMousewheel = (event: any) => {
    // Prevent scrolling of the background
    event.stopPropagation()

    const xThreshold = WHEEL_MOVE_X_THRESHOLD
    let actionDelay = 0
    const imageMoveDelay = 500

    this.clearTimeout(this.resetScrollTimeout)
    this.resetScrollTimeout = this.setTimeout(() => {
      this.scrollX = 0
      this.scrollY = 0
    }, 300)

    // Prevent rapid-fire zoom behavior
    if (this.wheelActionTimeout !== null || this.isAnimating()) {
      return
    }

    if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) {
      // handle horizontal scrolls with image moves
      this.scrollY = 0
      this.scrollX += event.deltaX

      const bigLeapX = xThreshold / 2
      // If the scroll amount has accumulated sufficiently, or a large leap was taken
      if (this.scrollX >= xThreshold || event.deltaX >= bigLeapX) {
        // Scroll right moves to next
        this.requestMoveNext(event)
        actionDelay = imageMoveDelay
        this.scrollX = 0
      } else if (this.scrollX <= -1 * xThreshold || event.deltaX <= -1 * bigLeapX) {
        // Scroll left moves to previous
        this.requestMovePrev(event)
        actionDelay = imageMoveDelay
        this.scrollX = 0
      }
    }

    // Allow successive actions after the set delay
    if (actionDelay !== 0) {
      this.wheelActionTimeout = this.setTimeout(() => {
        this.wheelActionTimeout = null
      }, actionDelay)
    }
  }

  const handleImageMouseWheel = (event: any) => {
    const yThreshold = WHEEL_MOVE_Y_THRESHOLD

    if (Math.abs(event.deltaY) >= Math.abs(event.deltaX)) {
      event.stopPropagation()
      // If the vertical scroll amount was large enough, perform a zoom
      if (Math.abs(event.deltaY) < yThreshold) {
        return
      }

      this.scrollX = 0
      this.scrollY += event.deltaY

      this.changeZoom(this.state.zoomLevel - event.deltaY, event.clientX, event.clientY)
    }
  }

  /**
   * Handle a double click on the current image
   */
  const handleImageDoubleClick = (event: any) => {
    if (this.state.zoomLevel > MIN_ZOOM_LEVEL) {
      // A double click when zoomed in zooms all the way out
      this.changeZoom(MIN_ZOOM_LEVEL, event.clientX, event.clientY)
    } else {
      // A double click when zoomed all the way out zooms in
      this.changeZoom(this.state.zoomLevel + ZOOM_BUTTON_INCREMENT_SIZE, event.clientX, event.clientY)
    }
  }

  const shouldHandleEvent = (source: any) => {
    if (this.eventsSource === source) {
      return true
    }
    if (this.eventsSource === SOURCE_ANY) {
      this.eventsSource = source
      return true
    }
    switch (source) {
      case SOURCE_MOUSE:
        return false
      case SOURCE_TOUCH:
        this.eventsSource = SOURCE_TOUCH
        this.filterPointersBySource()
        return true
      case SOURCE_POINTER:
        if (this.eventsSource === SOURCE_MOUSE) {
          this.eventsSource = SOURCE_POINTER
          this.filterPointersBySource()
          return true
        }
        return false
      default:
        return false
    }
  }

  const addPointer = (pointer: any) => {
    this.pointerList.push(pointer)
  }

  const removePointer = (pointer: any) => {
    this.pointerList = this.pointerList.filter(({ id }: any) => id !== pointer.id)
  }

  const filterPointersBySource = () => {
    this.pointerList = this.pointerList.filter(({ source }: any) => source === this.eventsSource)
  }

  const handleMouseDown = (event: any) => {
    if (this.shouldHandleEvent(SOURCE_MOUSE) && ReactImageLightbox.isTargetMatchImage(event.target)) {
      this.addPointer(ReactImageLightbox.parseMouseEvent(event))
      this.multiPointerStart(event)
    }
  }

  const handleMouseMove = (event: any) => {
    if (this.shouldHandleEvent(SOURCE_MOUSE)) {
      this.multiPointerMove(event, [ReactImageLightbox.parseMouseEvent(event)])
    }
  }

  const handleMouseUp = (event: any) => {
    if (this.shouldHandleEvent(SOURCE_MOUSE)) {
      this.removePointer(ReactImageLightbox.parseMouseEvent(event))
      this.multiPointerEnd(event)
    }
  }

  const handlePointerEvent = (event: any) => {
    if (this.shouldHandleEvent(SOURCE_POINTER)) {
      switch (event.type) {
        case 'pointerdown':
          if (ReactImageLightbox.isTargetMatchImage(event.target)) {
            this.addPointer(ReactImageLightbox.parsePointerEvent(event))
            this.multiPointerStart(event)
          }
          break
        case 'pointermove':
          this.multiPointerMove(event, [ReactImageLightbox.parsePointerEvent(event)])
          break
        case 'pointerup':
        case 'pointercancel':
          this.removePointer(ReactImageLightbox.parsePointerEvent(event))
          this.multiPointerEnd(event)
          break
        default:
          break
      }
    }
  }

  const handleTouchStart = (event: any) => {
    if (this.shouldHandleEvent(SOURCE_TOUCH) && ReactImageLightbox.isTargetMatchImage(event.target)) {
      ;[].forEach.call(event.changedTouches, (eventTouch: any) =>
        this.addPointer(ReactImageLightbox.parseTouchPointer(eventTouch))
      )
      this.multiPointerStart(event)
    }
  }

  const handleTouchMove = (event: any) => {
    if (this.shouldHandleEvent(SOURCE_TOUCH)) {
      this.multiPointerMove(
        event,
        [].map.call(event.changedTouches, (eventTouch: any) => ReactImageLightbox.parseTouchPointer(eventTouch))
      )
    }
  }

  const handleTouchEnd = (event: any) => {
    if (this.shouldHandleEvent(SOURCE_TOUCH)) {
      ;[].map.call(event.changedTouches, (touch: any) =>
        this.removePointer(ReactImageLightbox.parseTouchPointer(touch))
      )
      this.multiPointerEnd(event)
    }
  }

  const decideMoveOrSwipe = (pointer: any) => {
    if (this.state.zoomLevel <= MIN_ZOOM_LEVEL) {
      this.handleSwipeStart(pointer)
    } else {
      this.handleMoveStart(pointer)
    }
  }

  const multiPointerStart = (event: any) => {
    this.handleEnd(null)
    switch (this.pointerList.length) {
      case 1: {
        event.preventDefault()
        this.decideMoveOrSwipe(this.pointerList[0])
        break
      }
      case 2: {
        event.preventDefault()
        this.handlePinchStart(this.pointerList)
        break
      }
      default:
        break
    }
  }

  const multiPointerMove = (event: any, pointerList: any) => {
    switch (this.currentAction) {
      case ACTION_MOVE: {
        event.preventDefault()
        this.handleMove(pointerList[0])
        break
      }
      case ACTION_SWIPE: {
        event.preventDefault()
        this.handleSwipe(pointerList[0])
        break
      }
      case ACTION_PINCH: {
        event.preventDefault()
        this.handlePinch(pointerList)
        break
      }
      default:
        break
    }
  }

  const multiPointerEnd = (event: any) => {
    if (this.currentAction !== ACTION_NONE) {
      this.setPreventInnerClose()
      this.handleEnd(event)
    }
    switch (this.pointerList.length) {
      case 0: {
        this.eventsSource = SOURCE_ANY
        break
      }
      case 1: {
        event.preventDefault()
        this.decideMoveOrSwipe(this.pointerList[0])
        break
      }
      case 2: {
        event.preventDefault()
        this.handlePinchStart(this.pointerList)
        break
      }
      default:
        break
    }
  }

  const handleEnd = (event: any) => {
    switch (this.currentAction) {
      case ACTION_MOVE:
        // @ts-expect-error TS(2554): Expected 0 arguments, but got 1.
        this.handleMoveEnd(event)
        break
      case ACTION_SWIPE:
        this.handleSwipeEnd(event)
        break
      case ACTION_PINCH:
        // @ts-expect-error TS(2554): Expected 0 arguments, but got 1.
        this.handlePinchEnd(event)
        break
      default:
        break
    }
  }

  // Handle move start over the lightbox container
  // This happens:
  // - On a mouseDown event
  // - On a touchstart event
  // @ts-expect-error TS(7031): Binding element 'clientX' implicitly has an 'any' ... Remove this comment to see the full error message
  const handleMoveStart = ({ x: clientX, y: clientY }) => {
    if (!this.props.enableZoom) {
      return
    }
    this.currentAction = ACTION_MOVE
    this.moveStartX = clientX
    this.moveStartY = clientY
    this.moveStartOffsetX = this.state.offsetX
    this.moveStartOffsetY = this.state.offsetY
  }

  // Handle dragging over the lightbox container
  // This happens:
  // - After a mouseDown and before a mouseUp event
  // - After a touchstart and before a touchend event
  // @ts-expect-error TS(7031): Binding element 'clientX' implicitly has an 'any' ... Remove this comment to see the full error message
  const handleMove = ({ x: clientX, y: clientY }) => {
    const newOffsetX = this.moveStartX - clientX + this.moveStartOffsetX
    const newOffsetY = this.moveStartY - clientY + this.moveStartOffsetY
    if (this.state.offsetX !== newOffsetX || this.state.offsetY !== newOffsetY) {
      this.setState({
        offsetX: newOffsetX,
        offsetY: newOffsetY
      })
    }
  }

  const handleMoveEnd = () => {
    this.currentAction = ACTION_NONE
    this.moveStartX = 0
    this.moveStartY = 0
    this.moveStartOffsetX = 0
    this.moveStartOffsetY = 0
    // Snap image back into frame if outside max offset range
    const maxOffsets = this.getMaxOffsets()
    const nextOffsetX = Math.max(maxOffsets.minX, Math.min(maxOffsets.maxX, this.state.offsetX))
    const nextOffsetY = Math.max(maxOffsets.minY, Math.min(maxOffsets.maxY, this.state.offsetY))
    if (nextOffsetX !== this.state.offsetX || nextOffsetY !== this.state.offsetY) {
      this.setState({
        offsetX: nextOffsetX,
        offsetY: nextOffsetY,
        shouldAnimate: true
      })
      this.setTimeout(() => {
        this.setState({ shouldAnimate: false })
      }, this.props.animationDuration)
    }
  }

  // @ts-expect-error TS(7031): Binding element 'clientX' implicitly has an 'any' ... Remove this comment to see the full error message
  const handleSwipeStart = ({ x: clientX, y: clientY }) => {
    this.currentAction = ACTION_SWIPE
    this.swipeStartX = clientX
    this.swipeStartY = clientY
    this.swipeEndX = clientX
    this.swipeEndY = clientY
  }

  // @ts-expect-error TS(7031): Binding element 'clientX' implicitly has an 'any' ... Remove this comment to see the full error message
  const handleSwipe = ({ x: clientX, y: clientY }) => {
    this.swipeEndX = clientX
    this.swipeEndY = clientY
  }

  const handleSwipeEnd = (event: any) => {
    const xDiff = this.swipeEndX - this.swipeStartX
    const xDiffAbs = Math.abs(xDiff)
    const yDiffAbs = Math.abs(this.swipeEndY - this.swipeStartY)

    this.currentAction = ACTION_NONE
    this.swipeStartX = 0
    this.swipeStartY = 0
    this.swipeEndX = 0
    this.swipeEndY = 0

    if (!event || this.isAnimating() || xDiffAbs < yDiffAbs * 1.5) {
      return
    }

    if (xDiffAbs < MIN_SWIPE_DISTANCE) {
      const boxRect = this.getLightboxRect()
      if (xDiffAbs < boxRect.width / 4) {
        return
      }
    }

    if (xDiff > 0 && this.props.prevSrc) {
      event.preventDefault()
      // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
      this.requestMovePrev()
    } else if (xDiff < 0 && this.props.nextSrc) {
      event.preventDefault()
      // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
      this.requestMoveNext()
    }
  }

  const calculatePinchDistance = ([a, b] = this.pinchTouchList) => {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
  }

  const calculatePinchCenter = ([a, b] = this.pinchTouchList) => {
    return {
      x: a.x - (a.x - b.x) / 2,
      y: a.y - (a.y - b.y) / 2
    }
  }

  const handlePinchStart = (pointerList: any) => {
    if (!this.props.enableZoom) {
      return
    }
    this.currentAction = ACTION_PINCH
    this.pinchTouchList = pointerList.map(({ id, x, y }: any) => ({ id, x, y }))
    this.pinchDistance = this.calculatePinchDistance()
  }

  const handlePinch = (pointerList: any) => {
    this.pinchTouchList = this.pinchTouchList.map((oldPointer: any) => {
      for (let i = 0; i < pointerList.length; i += 1) {
        if (pointerList[i].id === oldPointer.id) {
          return pointerList[i]
        }
      }

      return oldPointer
    })

    const newDistance = this.calculatePinchDistance()

    const zoomLevel = this.state.zoomLevel + newDistance - this.pinchDistance

    this.pinchDistance = newDistance
    const { x: clientX, y: clientY } = this.calculatePinchCenter(this.pinchTouchList)
    this.changeZoom(zoomLevel, clientX, clientY)
  }

  const handlePinchEnd = () => {
    this.currentAction = ACTION_NONE
    this.pinchTouchList = null
    this.pinchDistance = 0
  }

  // Handle the window resize event
  const handleWindowResize = () => {
    this.clearTimeout(this.resizeTimeout)
    this.resizeTimeout = this.setTimeout(this.forceUpdate.bind(this), 100)
  }

  const handleZoomInButtonClick = () => {
    const nextZoomLevel = this.state.zoomLevel + ZOOM_BUTTON_INCREMENT_SIZE
    // @ts-expect-error TS(2554): Expected 3 arguments, but got 1.
    this.changeZoom(nextZoomLevel)
    if (nextZoomLevel === MAX_ZOOM_LEVEL) {
      this.zoomOutBtn.current.focus()
    }
  }

  const handleZoomOutButtonClick = () => {
    const nextZoomLevel = this.state.zoomLevel - ZOOM_BUTTON_INCREMENT_SIZE
    // @ts-expect-error TS(2554): Expected 3 arguments, but got 1.
    this.changeZoom(nextZoomLevel)
    if (nextZoomLevel === MIN_ZOOM_LEVEL) {
      this.zoomInBtn.current.focus()
    }
  }

  const handleCaptionMousewheel = (event: any) => {
    event.stopPropagation()

    if (!this.caption.current) {
      return
    }

    const { height } = this.caption.current.getBoundingClientRect()
    const { scrollHeight, scrollTop } = this.caption.current
    if ((event.deltaY > 0 && height + scrollTop >= scrollHeight) || (event.deltaY < 0 && scrollTop <= 0)) {
      event.preventDefault()
    }
  }

  // Detach key and mouse input events
  const isAnimating = () => {
    return this.state.shouldAnimate || this.state.isClosing
  }

  // Check if image is loaded
  const isImageLoaded = (imageSrc: any) => {
    return imageSrc && imageSrc in this.imageCache && this.imageCache[imageSrc].loaded
  }

  // Load image from src and call callback with image width and height on load
  const loadImage = (srcType: any, imageSrc: any, done: any) => {
    // Return the image info if it is already cached
    if (this.isImageLoaded(imageSrc)) {
      this.setTimeout(() => {
        done()
      }, 1)
      return
    }

    const inMemoryImage = new global.Image()

    if (this.props.imageCrossOrigin) {
      inMemoryImage.crossOrigin = this.props.imageCrossOrigin
    }

    inMemoryImage.onerror = (errorEvent: any) => {
      this.props.onImageLoadError(imageSrc, srcType, errorEvent)

      // failed to load so set the state loadErrorStatus
      this.setState((prevState: any) => ({
        loadErrorStatus: { ...prevState.loadErrorStatus, [srcType]: true }
      }))

      done(errorEvent)
    }

    inMemoryImage.onload = () => {
      this.props.onImageLoad(imageSrc, srcType, inMemoryImage)

      this.imageCache[imageSrc] = {
        loaded: true,
        width: inMemoryImage.width,
        height: inMemoryImage.height
      }

      done()
    }

    inMemoryImage.src = imageSrc
  }

  // Load all images and their thumbnails
  const loadAllImages = (props = this.props) => {
    const generateLoadDoneCallback = (srcType: any, imageSrc: any) => (err: any) => {
      // Give up showing image on error
      if (err) {
        return
      }

      // Don't rerender if the src is not the same as when the load started
      // or if the component has unmounted
      if (this.props[srcType] !== imageSrc || this.didUnmount) {
        return
      }

      // Force rerender with the new image
      this.forceUpdate()
    }

    // Load the images
    this.getSrcTypes().forEach(srcType => {
      const type = srcType.name

      // there is no error when we try to load it initially
      if (props[type] && this.state.loadErrorStatus[type]) {
        this.setState((prevState: any) => ({
          loadErrorStatus: { ...prevState.loadErrorStatus, [type]: false }
        }))
      }

      // Load unloaded images
      if (props[type] && !this.isImageLoaded(props[type])) {
        this.loadImage(type, props[type], generateLoadDoneCallback(type, props[type]))
      }
    })
  }

  // Request that the lightbox be closed
  const requestClose = (event: any) => {
    // Call the parent close request
    const closeLightbox = () => this.props.onCloseRequest(event)

    if (this.props.animationDisabled || (event.type === 'keydown' && !this.props.animationOnKeyInput)) {
      // No animation
      closeLightbox()
      return
    }

    // With animation
    // Start closing animation
    this.setState({ isClosing: true })

    // Perform the actual closing at the end of the animation
    this.setTimeout(closeLightbox, this.props.animationDuration)
  }

  const requestMove = (direction: 'prev' | 'next', event: any) => {
    console.log('Requesting to move')
    // Reset the zoom level on image move
    const nextState = {
      zoomLevel: MIN_ZOOM_LEVEL,
      offsetX: 0,
      offsetY: 0
    }

    // Enable animated states
    if (!this.props.animationDisabled && (!this.keyPressed || this.props.animationOnKeyInput)) {
      ;(nextState as any).shouldAnimate = true
      this.setTimeout(() => this.setState({ shouldAnimate: false }), this.props.animationDuration)
    }
    this.keyPressed = false

    this.moveRequested = true

    if (direction === 'prev') {
      this.keyCounter -= 1
      this.setState(nextState)
      this.props.onMovePrevRequest(event)
    } else {
      this.keyCounter += 1
      this.setState(nextState)
      console.log('I am here')
      this.props.onMoveNextRequest(event)
    }
  }

  // Request to transition to the next image
  const requestMoveNext = (event: any) => {
    this.requestMove('next', event)
  }

  // Request to transition to the previous image
  const requestMovePrev = (event: any) => {
    this.requestMove('prev', event)
  }
}
