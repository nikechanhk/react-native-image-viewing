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
  StyleSheet,
  NativeScrollEvent,
  NativeSyntheticEvent,
  NativeMethodsMixin,
  ScaledSize,
  TouchableWithoutFeedback,
} from "react-native";

import usePanResponder from "../../hooks/usePanResponder";
import useImageDimensions from "../../hooks/useImageDimensions";

import { getImageStyles, getImageTransform } from "../../utils";
import { ImageSource } from "../../@types";
import { ImageLoading } from "./ImageLoading";
import { Props } from "./ImageItem.d";

import { Image as ExpoImage } from "expo-image";

const SWIPE_CLOSE_OFFSET = 75;
const SWIPE_CLOSE_VELOCITY = 1.75;

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
  onSingleTap,
}: Props) => {
  const imageContainer = useRef<ScrollView & NativeMethodsMixin>(null);
  const imageDimensions = useImageDimensions(imageSrc) || { width: 0, height: 0 };
  // Re-calculate transform when layout changes or image dimensions become available
  // Ensure images fit screen width first, then adjust height based on aspect ratio
  const adjustedDimensions = {
    width: layout.width,
    height: imageDimensions.width > 0 && imageDimensions.height > 0 ? 
      (layout.width * (imageDimensions.height / imageDimensions.width)) : 
      layout.height * 0.8
  };
  const [translate, scale] = getImageTransform(adjustedDimensions, { width: layout.width, height: layout.height });
  const scrollValueY = new Animated.Value(0);
  const [isLoaded, setLoadEnd] = useState(false);
  
  // Force redraw when orientation changes
  useEffect(() => {
    if (onZoomPerformed) {
      // Reset zoom state when orientation changes
      onZoomPerformed(false);
    }
  }, [layout.width, layout.height]);

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
        // Reset position when layout changes (orientation change)
        imageContainer.current.scrollTo({ y: layout.height, animated: false});
    }
  }, [imageContainer, layout.height, layout.width]);

  const onLongPressHandler = useCallback(() => {
    onLongPress(imageSrc);
  }, [imageSrc, onLongPress]);
  
  // 跟踪點擊狀態，用於區分單擊和雙擊
  const lastTapRef = useRef<number>(0);
  const lastTapPositionRef = useRef<{ x: number, y: number } | null>(null);
  
  // 處理單擊事件，與 iOS 版本保持一致
  // 直接使用獨立處理機制，不依賴 usePanResponder
  const handleSingleTap = useCallback(() => {
    console.log('SingleTap detected on Android');
    if (onSingleTap) {
      onSingleTap();
    }
  }, [onSingleTap]);

  const [panHandlers, scaleValue, translateValue] = usePanResponder({
    initialScale: scale || 1,
    initialTranslate: translate || { x: 0, y: 0 },
    onZoom: onZoomPerformed,
    doubleTapToZoomEnabled,
    onLongPress: onLongPressHandler,
    delayLongPress,
    currentImageIndex,
    layout,
    onSingleTap: handleSingleTap,
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
  // 確保圖片有有效寬高，用作備份尺寸以防止原始尺寸為零
  const fallbackWidth = layout.width; 
  const fallbackHeight = layout.height;
  
  // 專門為 Android 調整圖片樣式，確保圖片始終可見
  const imageStylesWithOpacity = { 
    ...imagesStyles, 
    opacity: 1,
    // 確保圖片元素至少有最小尺寸
    width: layout.width,
  };

  const onScrollEndDrag = ({
    nativeEvent,
  }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const velocityY = nativeEvent?.velocity?.y ?? 0;
    const offsetY = nativeEvent?.contentOffset?.y ?? 0;

    if ((Math.abs(velocityY) > SWIPE_CLOSE_VELOCITY &&
            (offsetY > SWIPE_CLOSE_OFFSET + layout.height || offsetY < -SWIPE_CLOSE_OFFSET + layout.height)))
             {
            onRequestClose();
        }
  };

  const onScroll = ({
    nativeEvent,
  }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = nativeEvent?.contentOffset?.y ?? 0;

    scrollValueY.setValue(offsetY);

    if (offsetY > layout.height + layout.height / 2 ||
        offsetY < layout.height - layout.height / 2) {
            onRequestClose();
        }
  };

  return (
    <View style={styles.container}>
      {/* 最外层透明点击层，用于捕获单击事件 */}
      <TouchableWithoutFeedback onPress={handleSingleTap}>
        <View 
          pointerEvents="box-only" 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: layout.width,
            height: layout.height,
            zIndex: 1, // 设置较低的 zIndex 确保不影响其他手势
            backgroundColor: 'transparent'
          }} />
      </TouchableWithoutFeedback>
      
      <View style={styles.centerContainer}>
        <ScrollView
          ref={imageContainer}
          style={styles.listItem}
          pagingEnabled
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.imageScrollContainer}
          scrollEnabled={true} // 始终启用滚动以确保可以上下滚动
          {...(swipeToCloseEnabled && {
            onScroll,
            onScrollEndDrag,
          })}
        >
          <View style={{ height: layout.height }} />
          {/* 恢复手势处理器以支持缩放 */}
          <Animated.View
            {...panHandlers}
            style={[imageStylesWithOpacity, { zIndex: 5 }]}
            collapsable={false}
          >
            <ExpoImage
              source={imageSrc}
              style={{
                width: layout.width,
                height: layout.height,
                alignSelf: 'center',
              }}
              contentFit="contain"
              contentPosition="center"
              onLoad={onLoaded}
            />
          </Animated.View>
        </ScrollView>
      </View>
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
  centerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItem: {
    width: "100%",
    height: "100%",
  },
  imageScrollContainer: {
    height: "300%",
  },
});

export default React.memo(ImageItem);
