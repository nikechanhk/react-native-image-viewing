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
  Dimensions,
} from "react-native";

import useDoubleTapToZoom from "../../hooks/useDoubleTapToZoom";
import useImageDimensions from "../../hooks/useImageDimensions";

import { ImageSource } from "../../@types";
import { ImageLoading } from "./ImageLoading";
import { Props } from "./ImageItem.d";

import { Image as ExpoImage } from "expo-image";

const SWIPE_CLOSE_OFFSET = 75;
const SWIPE_CLOSE_VELOCITY = 1.55;

// A very simple component that prioritizes vertical centering
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
  const scrollViewRef = useRef<ScrollView>(null);
  const [loaded, setLoaded] = useState(false);
  const [scaled, setScaled] = useState(false);
  const imageDimensions = useImageDimensions(imageSrc) || { width: 0, height: 0 };
  
  // 跟踪最後一次點擊的時間和位置
  const lastTapRef = useRef<number>(0);
  const lastTapPositionRef = useRef<{ x: number, y: number } | null>(null);
  
  // 用原生的 handleDoubleTap 來縮放
  const doubleTapZoom = useDoubleTapToZoom(scrollViewRef, scaled, layout);
  
  // Reset scroll view when layout changes (orientation change)
  useEffect(() => {
    if (scrollViewRef.current && !scaled) {
      scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: false });
    }
  }, [layout.width, layout.height, scaled]);

  // Determine proper size to maintain aspect ratio
  const aspectRatio = imageDimensions.width && imageDimensions.height ? 
    imageDimensions.width / imageDimensions.height : 
    1;
  
  // Check if image is very tall (height much greater than width)
  const isTallImage = aspectRatio < 0.7; // 高/寬 比例大於 1.67 的圖片視為長圖
  
  // For tall images, prioritize showing full height
  // For normal or wide images, prioritize showing full width
  let imageWidth, imageHeight;
  
  if (isTallImage) {
    imageHeight = Math.min(layout.height * 0.95, layout.width / aspectRatio); // 使用 95% 的屏幕高度
    imageWidth = imageHeight * aspectRatio;
  } else {
    imageWidth = layout.width;
    imageHeight = imageWidth / aspectRatio;
  }
  
  const maxScale = 3; // Simple fixed max zoom

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
    // Simple scroll handler for vertical swipes
    if (nativeEvent?.zoomScale > 1) {
      return;
    }
  };

  const onLongPressHandler = useCallback(
    (event: GestureResponderEvent) => {
      onLongPress(imageSrc);
    },
    [imageSrc, onLongPress]
  );

  // 處理點擊事件，區分單擊和雙擊
  const handlePress = useCallback((event: GestureResponderEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // 毫秒
    const DOUBLE_TAP_RADIUS = 20; // 允許的雙擊位置誤差半徑(像素)
    
    const position = {
      x: event.nativeEvent.locationX,
      y: event.nativeEvent.locationY
    };
    
    // 判斷是否是雙擊
    const isDoubleTap = lastTapRef.current > 0 && 
                      (now - lastTapRef.current) < DOUBLE_TAP_DELAY &&
                      lastTapPositionRef.current &&
                      Math.abs(position.x - lastTapPositionRef.current.x) < DOUBLE_TAP_RADIUS &&
                      Math.abs(position.y - lastTapPositionRef.current.y) < DOUBLE_TAP_RADIUS;
    
    if (isDoubleTap) {
      // 雙擊處理
      lastTapRef.current = 0;
      lastTapPositionRef.current = null;
      
      // 如果啟用了雙擊縮放，執行縮放
      if (doubleTapToZoomEnabled) {
        doubleTapZoom(event);
      }
    } else {
      // 單擊處理
      lastTapRef.current = now;
      lastTapPositionRef.current = position;
      
      // 延遲處理單擊事件，等待可能的雙擊
      setTimeout(() => {
        // 如果 lastTap 沒有被重置，表示這是一個單擊
        if (lastTapRef.current === now && onSingleTap) {
          onSingleTap();
        }
      }, DOUBLE_TAP_DELAY);
    }
  }, [doubleTapToZoomEnabled, doubleTapZoom, onSingleTap]);

  return (
    <View style={styles.container}>
      {/* {(!loaded || !imageDimensions) && <ImageLoading />} */}
      
      <View style={styles.imageWrapper}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{
            minHeight: layout.height,
            minWidth: layout.width,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          style={styles.scrollView}
          scrollsToTop={false}
          pinchGestureEnabled
          maximumZoomScale={maxScale}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          scrollEnabled={swipeToCloseEnabled}
          onScrollEndDrag={onScrollEndDrag}
          {...(swipeToCloseEnabled && { onScroll })}
        >
          <TouchableWithoutFeedback
            onPress={handlePress}
            onLongPress={onLongPressHandler}
            delayLongPress={delayLongPress}
          >
            <View style={styles.touchableContainer}>
              <ExpoImage
                source={imageSrc}
                style={{
                  width: isTallImage ? imageWidth : layout.width,
                  height: imageHeight,
                  alignSelf: 'center'
                }}
                contentFit="contain"
                contentPosition="center"
                onLoad={() => setLoaded(true)}
              />
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  imageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    alignSelf: 'stretch',
  },
  touchableContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  }
});

export default React.memo(ImageItem);
