/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useCallback, useRef, useState, useMemo } from "react";

import {
  Animated,
  ScrollView,
  StyleSheet,
  View,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TouchableWithoutFeedback,
  GestureResponderEvent,
  ScaledSize,
  Platform,
} from "react-native";

import useDoubleTapToZoom from "../../hooks/useDoubleTapToZoom";
import useImageDimensions from "../../hooks/useImageDimensions";

import { getImageStyles, getImageTransform } from "../../utils";
import { ImageSource } from "../../@types";
import { ImageLoading } from "./ImageLoading";

import { Image as ExpoImage } from "expo-image";

const SWIPE_CLOSE_OFFSET = 75;
const SWIPE_CLOSE_VELOCITY = 1.75; // Slightly higher threshold for Android

type Props = {
  imageSrc: ImageSource;
  onRequestClose: () => void;
  onZoom: (scaled: boolean) => void;
  onLongPress: (image: ImageSource) => void;
  delayLongPress: number;
  swipeToCloseEnabled?: boolean;
  doubleTapToZoomEnabled?: boolean;
  currentImageIndex?: number;
  layout: ScaledSize;
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
  layout,
}: Props) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [loaded, setLoaded] = useState(false);
  // Force image to be visible on Android regardless of loaded state
  const [scaled, setScaled] = useState(false);
  const imageDimensions = useImageDimensions(imageSrc) || { width: 0, height: 0 };
  const handleDoubleTap = useDoubleTapToZoom(scrollViewRef, scaled, layout);

  const [translate, scale] = getImageTransform(imageDimensions, { width: layout.width, height: layout.height });
  const scrollValueY = new Animated.Value(0);
  const scaleValue = new Animated.Value(scale || 1);
  const translateValue = new Animated.ValueXY(translate);
  const maxScale = scale && scale > 0 ? Math.max(1 / scale, 1) : 1;

  const imageOpacity = scrollValueY.interpolate({
    inputRange: [-SWIPE_CLOSE_OFFSET, 0, SWIPE_CLOSE_OFFSET],
    outputRange: [0.5, 1, 0.5],
  });
  const imagesStyles = getImageStyles(
    imageDimensions,
    translateValue,
    scaleValue
  );
  const imageStylesWithOpacity = { ...imagesStyles, opacity: imageOpacity };

  const onScrollEndDrag = useCallback(
    ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
      const velocityY = nativeEvent?.velocity?.y ?? 0;
      const scaled = nativeEvent?.zoomScale > 1;

      onZoom(scaled);
      setScaled(scaled);

      if (
        !scaled &&
        swipeToCloseEnabled &&
        Math.abs(velocityY) > SWIPE_CLOSE_VELOCITY
      ) {
        onRequestClose();
      }
    },
    [scaled, swipeToCloseEnabled, onRequestClose, onZoom]
  );

  const onScroll = ({
    nativeEvent,
  }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = nativeEvent?.contentOffset?.y ?? 0;

    // On Android, we need to check both zoomScale and contentSize
    // as zoomScale behavior can be inconsistent
    if (
      (nativeEvent?.zoomScale > 1) ||
      (nativeEvent?.contentSize?.height > layout.height)
    ) {
      return;
    }

    scrollValueY.setValue(offsetY);
  };

  const onLongPressHandler = useCallback(
    (event: GestureResponderEvent) => {
      onLongPress(imageSrc);
    },
    [imageSrc, onLongPress]
  );

  const dynamicStyles = useMemo(() => ({
    listItem: {
      width: layout.width,
      height: layout.height,
    },
    imageScrollContainer: {
      height: layout.height,
    },
  }), [layout.width, layout.height]);

  return (
    <View>
      <ScrollView
        ref={scrollViewRef}
        style={dynamicStyles.listItem}
        pinchGestureEnabled
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        maximumZoomScale={5}
        contentContainerStyle={dynamicStyles.imageScrollContainer}
        scrollEnabled={swipeToCloseEnabled}
        onScrollEndDrag={onScrollEndDrag}
        scrollEventThrottle={16} // Higher value for better Android performance
        {...(swipeToCloseEnabled && {
          onScroll,
        })}
        // Android-specific overscroll mode
        overScrollMode="never"
      >
        {/* Loading indicator is disabled for Android as it can interfere with image display */}
        <TouchableWithoutFeedback
          onPress={doubleTapToZoomEnabled ? handleDoubleTap : undefined}
          onLongPress={onLongPressHandler}
          delayLongPress={delayLongPress}
        >
          <Animated.View
            style={imageStylesWithOpacity}
          >
            <ExpoImage
              source={imageSrc}
              style={{
                width: "100%",
                height: "100%",
              }}
              onLoad={() => setLoaded(true)}
              // Android-specific settings
              cachePolicy="memory-disk"
              contentFit="contain"
              transition={300}
            />
          </Animated.View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </View>
  );
};

export default React.memo(ImageItem);