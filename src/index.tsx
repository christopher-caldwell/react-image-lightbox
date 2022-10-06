import React, { FC } from 'react'
import Modal from 'react-modal'

import { MIN_ZOOM_LEVEL } from './constant'
import { OwnProps, useLightbox } from './api'
import {
  Toolbar,
  ErrorImage,
  Image,
  FallbackLoader,
  FallbackImage,
  DiscourageDownloadImage,
  NavButton,
  Caption
} from './components'
import { mergePropsWithDefault, translate } from './util'

export const Lightbox: FC<OwnProps> = props => {
  const mergedProps = mergePropsWithDefault(props)
  const {
    isOpen,
    animationDisabled,
    animationDuration,
    clickOutsideToClose,
    discourageDownloads,
    enableZoom,
    imageTitle,
    nextSrc,
    prevSrc,
    toolbarButtons,
    reactModalStyle,
    onAfterOpen,
    imageCrossOrigin,
    reactModalProps,
    loader
  } = mergedProps
  const {
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
    // handleMouseDown,
    // handleMouseMove,
    // handleTouchStart,
    // handleTouchMove,
    handleKeyInput,
    closeIfClickInner,
    zoomInBtn,
    handleZoomInButtonClick,
    zoomOutBtn,
    handleZoomOutButtonClick,
    handleCaptionMousewheel,
    caption,
    requestMovePrev,
    requestMoveNext
  } = useLightbox(mergedProps)

  const boxSize = getLightboxRect()
  let transitionStyle = {}

  // Transition settings for sliding animations
  if (!animationDisabled && isAnimating()) {
    transitionStyle = {
      ...transitionStyle,
      transition: `transform ${animationDuration}ms`
    }
  }

  // Key endings to differentiate between images with the same src
  const keyEndings: Record<string, string> = {}
  getSrcTypes().forEach(({ name, keyEnding }) => {
    keyEndings[name] = keyEnding
  })

  // Images to be displayed
  const images: JSX.Element[] = []
  const addImage = (srcType: string, imageClass: string, transforms: any) => {
    // Ignore types that have no source defined for their full size image
    //@ts-expect-error FIXME JS-y accessing props
    if (!props[srcType]) {
      return
    }
    const bestImageInfo = getBestImageForType(srcType)

    const imageStyle: React.CSSProperties = {
      ...transitionStyle,
      ...getTransform({
        ...transforms,
        ...bestImageInfo
      })
    }

    if (zoomLevel > MIN_ZOOM_LEVEL) {
      imageStyle.cursor = 'move'
    }

    // support IE 9 and 11
    const hasTrueValue = function <TObject extends Record<string, unknown>>(object: TObject) {
      return Object.keys(object).some(key => object[key])
    }

    // when error on one of the loads then push custom error stuff
    if (bestImageInfo === null && hasTrueValue(loadErrorStatus)) {
      images.push(
        <ErrorImage
          //@ts-expect-error FIXME JS-y accessing props
          key={props[srcType] + keyEndings[srcType]}
          imageClass={imageClass}
          imageStyle={imageStyle}
          imageLoadErrorMessage={props.imageLoadErrorMessage}
        />
      )

      return
    }
    if (bestImageInfo === null) {
      const loadingIcon = loader !== undefined ? loader : <FallbackLoader />

      // Fall back to loading icon if the thumbnail has not been loaded
      images.push(
        <FallbackImage
          imageClass={imageClass}
          imageStyle={imageStyle}
          //@ts-expect-error FIXME JS-y accessing props
          key={props[srcType] + keyEndings[srcType]}
          loadingIcon={loadingIcon}
        />
      )

      return
    }

    const imageSrc = bestImageInfo.src
    if (discourageDownloads) {
      imageStyle.backgroundImage = `url('${imageSrc}')`
      images.push(
        <DiscourageDownloadImage
          imageClass={imageClass}
          onDoubleClick={handleImageDoubleClick}
          onWheel={handleImageMouseWheel}
          imageStyle={imageStyle}
          key={imageSrc + keyEndings[srcType]}
        />
      )
    } else {
      images.push(
        <Image
          imageCrossOrigin={imageCrossOrigin}
          key={imageSrc + keyEndings[srcType]}
          alt={typeof imageTitle === 'string' ? imageTitle : translate('Image')}
          onDoubleClick={handleImageDoubleClick}
          onWheel={handleImageMouseWheel}
          imageStyle={imageStyle}
          imageClass={imageClass}
          imageSrc={imageSrc}
        />
      )
    }
  }

  const zoomMultiplier = getZoomMultiplier()
  // Next Image (displayed on the right)
  addImage('nextSrc', 'ril-image-next ril__imageNext', {
    x: boxSize.width
  })
  // Main Image
  addImage('mainSrc', 'ril-image-current', {
    x: -1 * offsetX,
    y: -1 * offsetY,
    zoom: zoomMultiplier
  })
  // Previous Image (displayed on the left)
  addImage('prevSrc', 'ril-image-prev ril__imagePrev', {
    x: -1 * boxSize.width
  })

  const modalStyle: Modal.Styles = {
    overlay: {
      zIndex: 1000,
      backgroundColor: 'transparent',
      ...(reactModalStyle?.overlay || {}) // Allow style overrides via props
    },
    content: {
      backgroundColor: 'transparent',
      overflow: 'hidden', // Needed, otherwise keyboard shortcuts scroll the page
      border: 'none',
      borderRadius: 0,
      padding: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      ...(reactModalStyle?.content || {}) // Allow style overrides via props
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={clickOutsideToClose ? requestClose : undefined}
      onAfterOpen={() => {
        // Focus on the div with key handlers
        outerEl?.current?.focus()
        onAfterOpen?.()
      }}
      style={modalStyle}
      contentLabel={translate('Lightbox')}
      appElement={typeof window !== 'undefined' ? window.document.body : undefined}
      {...reactModalProps}
    >
      <div // eslint-disable-line jsx-a11y/no-static-element-interactions
        // Floating modal with closing animations
        className={`ril-outer ril__outer ril__outerAnimating ${props.wrapperClassName} ${
          isClosing ? 'ril-closing ril__outerClosing' : ''
        }`}
        style={{
          transition: `opacity ${animationDuration}ms`,
          animationDuration: `${animationDuration}ms`,
          animationDirection: isClosing ? 'normal' : 'reverse'
        }}
        ref={outerEl}
        // This can probs be removed.
        onWheel={handleOuterMousewheel}
        // onMouseMove={handleMouseMove}
        // onMouseDown={handleMouseDown}
        // onTouchStart={handleTouchStart}
        // onTouchMove={handleTouchMove}
        tabIndex={-1} // Enables key handlers on div
        onKeyDown={handleKeyInput}
        onKeyUp={handleKeyInput}
      >
        <div // eslint-disable-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
          // Image holder
          className='ril-inner ril__inner'
          onClick={clickOutsideToClose ? closeIfClickInner : undefined}
        >
          {images}
        </div>
        {prevSrc ? (
          <NavButton isAnimating={isAnimating} direction='Prev' label={props.prevLabel} requestMove={requestMovePrev} />
        ) : null}
        {nextSrc ? (
          <NavButton isAnimating={isAnimating} direction='Next' label={props.nextLabel} requestMove={requestMoveNext} />
        ) : null}

        <Toolbar
          zoomInButton={zoomInBtn}
          zoomLevel={zoomLevel}
          zoomInLabel={props.zoomInLabel}
          isAnimating={isAnimating}
          handleZoomInButtonClick={handleZoomInButtonClick}
          zoomOutButton={zoomOutBtn}
          zoomOutLabel={props.zoomOutLabel}
          handleZoomOutButtonClick={handleZoomOutButtonClick}
          closeLabel={props.closeLabel}
          requestClose={requestClose}
          enableZoom={enableZoom}
          toolbarButtons={toolbarButtons}
        />

        {props.imageCaption ? (
          <Caption
            handleCaptionMousewheel={handleCaptionMousewheel}
            captionRef={caption}
            imageCaption={props.imageCaption}
          />
        ) : null}
      </div>
    </Modal>
  )
}

export * from './api/useControlHelper'
