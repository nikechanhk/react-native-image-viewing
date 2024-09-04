/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useCallback, useRef, useState, useEffect } from "react";

import {
  View,
  Animated,
  ScrollView,
  Dimensions,
  StyleSheet,
  NativeScrollEvent,
  NativeSyntheticEvent,
  NativeMethodsMixin,
} from "react-native";

import useImageDimensions from "../../hooks/useImageDimensions";
import usePanResponder from "../../hooks/usePanResponder";

import { getImageStyles, getImageTransform } from "../../utils";
import { ImageSource } from "../../@types";
import { ImageLoading } from "./ImageLoading";

import { Image as ExpoImage } from "expo-image";

const SWIPE_CLOSE_OFFSET = 75;
const SWIPE_CLOSE_VELOCITY = 1.75;
const SCREEN = Dimensions.get("window");
const SCREEN_WIDTH = SCREEN.width;
const SCREEN_HEIGHT = SCREEN.height;

type Props = {
  imageSrc: ImageSource;
  onRequestClose: () => void;
  onZoom: (isZoomed: boolean) => void;
  onLongPress: (image: ImageSource) => void;
  delayLongPress: number;
  swipeToCloseEnabled?: boolean;
  doubleTapToZoomEnabled?: boolean;
  currentImageIndex: number;
};

const ImageItem = ({
  imageSrc,
  onZoom,
  onRequestClose,
  onLongPress,
  delayLongPress,
  swipeToCloseEnabled = true,
  doubleTapToZoomEnabled = true,
  currentImageIndex,
}: Props) => {
  const imageContainer = useRef<ScrollView & NativeMethodsMixin>(null);
  const imageDimensions = useImageDimensions(imageSrc);
  const [translate, scale] = getImageTransform(imageDimensions, SCREEN);
  const scrollValueY = new Animated.Value(0);
  const [isLoaded, setLoadEnd] = useState(false);

  const onLoaded = useCallback(() => setLoadEnd(true), []);
  const onZoomPerformed = useCallback(
    (isZoomed: boolean) => {
      onZoom(isZoomed);
      if (imageContainer?.current) {
        imageContainer.current.setNativeProps({
          scrollEnabled: !isZoomed,
        });
      }
    },
    [imageContainer]
  );

  useEffect(() => {
    if (imageContainer.current) {
        imageContainer.current.scrollTo({ y: SCREEN_HEIGHT, animated: false});
    }
  }, [imageContainer]);

  const onLongPressHandler = useCallback(() => {
    onLongPress(imageSrc);
  }, [imageSrc, onLongPress]);

  const [panHandlers, scaleValue, translateValue] = usePanResponder({
    initialScale: scale || 1,
    initialTranslate: translate || { x: 0, y: 0 },
    onZoom: onZoomPerformed,
    doubleTapToZoomEnabled,
    onLongPress: onLongPressHandler,
    delayLongPress,
    currentImageIndex,
  });

  const imagesStyles = getImageStyles(
    imageDimensions,
    translateValue,
    scaleValue
  );
  const imageOpacity = scrollValueY.interpolate({
    inputRange: [-SWIPE_CLOSE_OFFSET, 0, SWIPE_CLOSE_OFFSET],
    outputRange: [0.7, 1, 0.7],
  });
  const imageStylesWithOpacity = { ...imagesStyles, opacity: 1 };

  const onScrollEndDrag = ({
    nativeEvent,
  }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const velocityY = nativeEvent?.velocity?.y ?? 0;
    const offsetY = nativeEvent?.contentOffset?.y ?? 0;

    if ((Math.abs(velocityY) > SWIPE_CLOSE_VELOCITY &&
            (offsetY > SWIPE_CLOSE_OFFSET + SCREEN_HEIGHT || offsetY < -SWIPE_CLOSE_OFFSET + SCREEN_HEIGHT)))
             {
            onRequestClose();
        }
  };

  const onScroll = ({
    nativeEvent,
  }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = nativeEvent?.contentOffset?.y ?? 0;

    scrollValueY.setValue(offsetY);

    if (offsetY > SCREEN_HEIGHT + SCREEN_HEIGHT / 2 ||
        offsetY < SCREEN_HEIGHT - SCREEN_HEIGHT / 2) {
            onRequestClose();
        }
  };

  return (
    <ScrollView
      ref={imageContainer}
      style={styles.listItem}
      pagingEnabled
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.imageScrollContainer}
      scrollEnabled={swipeToCloseEnabled}
      {...(swipeToCloseEnabled && {
        onScroll,
        onScrollEndDrag,
      })}
    >
      <View style={{ height: SCREEN_HEIGHT }} />
      <Animated.View
        {...panHandlers}
        style={imageStylesWithOpacity}
      >
        <ExpoImage
          source={imageSrc}
          style={{
            width: "100%",
            height: "100%",
          }}
          onLoad={onLoaded}
        />
      </Animated.View>
      {(!isLoaded || !imageDimensions) && <ImageLoading />}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  listItem: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  imageScrollContainer: {
    height: SCREEN_HEIGHT * 3,
  },
});

export default React.memo(ImageItem);
