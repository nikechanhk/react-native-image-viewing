/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useCallback, useRef, useState, useEffect } from "react";

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
} from "react-native";

import useDoubleTapToZoom from "../../hooks/useDoubleTapToZoom";
import useImageDimensions from "../../hooks/useImageDimensions";

import { getImageStyles, getImageTransform } from "../../utils";
import { ImageSource } from "../../@types";
import { ImageLoading } from "./ImageLoading";
import { Props } from "./ImageItem.d";

import { Image as ExpoImage } from "expo-image";

const SWIPE_CLOSE_OFFSET = 75;
const SWIPE_CLOSE_VELOCITY = 1.55;

// Props type is now imported from ImageItem.d.ts

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
  const [scaled, setScaled] = useState(false);
  const imageDimensions = useImageDimensions(imageSrc) || { width: 0, height: 0 };
  const handleDoubleTap = useDoubleTapToZoom(scrollViewRef, scaled, layout);
  
  // Reset scroll view when layout changes (orientation change)
  useEffect(() => {
    if (scrollViewRef.current && !scaled) {
      // Reset zoom and position when orientation changes
      scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: false });
      // Reset scale when orientation changes
      translateValue.setValue(translate);
      scaleValue.setValue(scale || 1);
    }
  }, [layout.width, layout.height, scaled]);

  // Ensure images fit screen width first, then adjust height based on aspect ratio
  const adjustedDimensions = {
    width: layout.width,
    height: imageDimensions.width > 0 && imageDimensions.height > 0 ? 
      (layout.width * (imageDimensions.height / imageDimensions.width)) : 
      layout.height * 0.8
  };
  const [translate, scale] = getImageTransform(adjustedDimensions, { width: layout.width, height: layout.height });
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
    [scaled]
  );

  const onScroll = ({
    nativeEvent,
  }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = nativeEvent?.contentOffset?.y ?? 0;

    if (nativeEvent?.zoomScale > 1) {
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

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.listItem}
        pinchGestureEnabled
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        maximumZoomScale={maxScale}
        contentContainerStyle={styles.imageScrollContainer}
        scrollEnabled={swipeToCloseEnabled}
        onScrollEndDrag={onScrollEndDrag}
        scrollEventThrottle={1}
        {...(swipeToCloseEnabled && {
          onScroll,
        })}
      >
        {(!loaded || !imageDimensions) && <ImageLoading />}
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
                width: layout.width,
                height: layout.height,
                alignSelf: 'center',
                resizeMode: 'contain',
              }}
              contentFit="contain"
              contentPosition="center"
              onLoad={() => setLoaded(true)}
            />
          </Animated.View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  listItem: {
    width: "100%",
    height: "100%",
    flex: 1,
  },
  imageScrollContainer: {
    width: "100%",
    height: "100%",
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
});

export default React.memo(ImageItem);
