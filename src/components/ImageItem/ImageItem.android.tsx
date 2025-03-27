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
  Dimensions,
  TouchableWithoutFeedback,
  GestureResponderEvent,
  PanResponder,
  TouchableOpacity,
} from "react-native";

import useImageDimensions from "../../hooks/useImageDimensions";

import { getImageStyles, getImageTransform } from "../../utils";
import { ImageSource } from "../../@types";
import { ImageLoading } from "./ImageLoading";
import { Props } from "./ImageItem.d";

import { Image as ExpoImage } from "expo-image";

const SWIPE_CLOSE_OFFSET = 75;
const SWIPE_CLOSE_VELOCITY = 1.75;
const DOUBLE_TAP_DELAY = 300; // ms

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
  // Refs
  const scrollViewRef = useRef<ScrollView & NativeMethodsMixin>(null);
  const doubleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  
  // State
  const [isLoaded, setIsLoaded] = useState(false);
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  
  // Get image dimensions
  const imageDimensions = useImageDimensions(imageSrc) || { width: 0, height: 0 };
  
  // Calculate dimensions that maintain aspect ratio
  const imageHeight = imageDimensions.width > 0 && imageDimensions.height > 0
    ? (layout.width * (imageDimensions.height / imageDimensions.width))
    : layout.height * 0.8;
  
  // For swipe to close functionality
  const scrollValueY = new Animated.Value(0);
  
  // Handle image load completion
  const onImageLoaded = useCallback(() => {
    console.log('[Android] Image loaded');
    setIsLoaded(true);
  }, []);

  // Toggle zoom state
  const toggleZoom = useCallback((zoomed: boolean) => {
    console.log('[Android] Zoom changed to:', zoomed);
    setIsZoomed(zoomed);
    onZoom(zoomed);
    
    // Update scroll enabled state
    if (scrollViewRef.current) {
      scrollViewRef.current.setNativeProps({
        scrollEnabled: !zoomed
      });
    }
  }, [onZoom]);
  
  // Reset on orientation change
  useEffect(() => {
    console.log('[Android] Layout changed, resetting zoom');
    toggleZoom(false);
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
    
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: layout.height, animated: false });
    }
  }, [layout.width, layout.height]);
  
  // Handle long press
  const handleLongPress = useCallback(() => {
    onLongPress(imageSrc);
  }, [imageSrc, onLongPress]);
  // Handle tap events (single & double)
  const handleTap = useCallback((event: GestureResponderEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_THRESHOLD = 300;
    
    // Check if this is a double tap
    if (now - lastTapTimeRef.current < DOUBLE_TAP_THRESHOLD) {
      console.log('[Android] Double-tap detected');
      
      // Toggle zoom
      if (doubleTapToZoomEnabled) {
        const newZoomState = !isZoomed;
        toggleZoom(newZoomState);
        if (newZoomState) {
          setScale(2); // Zoom in on double tap
        } else {
          setScale(1); // Reset zoom on second double tap
        }
      }
    } else {
      // This is a single tap (with delay to ensure it's not a double tap)
      setTimeout(() => {
        if (now - lastTapTimeRef.current >= DOUBLE_TAP_THRESHOLD) {
          console.log('[Android] Single-tap confirmed');
          if (onSingleTap) {
            onSingleTap();
          }
        }
      }, DOUBLE_TAP_THRESHOLD);
    }
    
    lastTapTimeRef.current = now;
  }, [doubleTapToZoomEnabled, isZoomed, onSingleTap]);
  
  // Handle scroll events for swipe-to-close
  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (swipeToCloseEnabled) {
        const offsetY = event.nativeEvent.contentOffset.y;
        scrollValueY.setValue(offsetY);
        
        // Check for swipe-to-close threshold
        if (
          offsetY > layout.height + layout.height / 2 ||
          offsetY < layout.height - layout.height / 2
        ) {
          onRequestClose();
        }
      }
    },
    [layout.height, swipeToCloseEnabled, onRequestClose, scrollValueY]
  );

  // Handle scroll end for swipe-to-close
  const onScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!swipeToCloseEnabled) return;
      
      const offsetY = event.nativeEvent.contentOffset.y;
      const velocityY = Math.abs(event.nativeEvent.velocity?.y || 0);
      
      if (
        velocityY > SWIPE_CLOSE_VELOCITY &&
        (offsetY > layout.height + SWIPE_CLOSE_OFFSET || 
         offsetY < layout.height - SWIPE_CLOSE_OFFSET)
      ) {
        onRequestClose();
      } else if (scrollViewRef.current) {
        // Return to center position if not closing
        scrollViewRef.current.scrollTo({ y: layout.height, animated: true });
      }
    },
    [layout.height, swipeToCloseEnabled, onRequestClose]
  );
  
  // Set up pan responder for pinch zoom
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture for multi-touch or significant movement
        return gestureState.numberActiveTouches === 2 || 
               Math.abs(gestureState.dx) > 10 || 
               Math.abs(gestureState.dy) > 10;
      },
      onMoveShouldSetPanResponderCapture: () => false,
      
      onPanResponderGrant: () => {
        // Start of gesture
      },
      
      onPanResponderMove: (event, gestureState) => {
        // Handle pinch to zoom with two fingers
        if (gestureState.numberActiveTouches === 2) {
          const touches = event.nativeEvent.touches;
          if (touches && touches.length >= 2) {
            // Calculate distance between touches
            const touch1 = touches[0];
            const touch2 = touches[1];
            
            if (touch1 && touch2) {
              const currentDistance = Math.sqrt(
                Math.pow(touch1.pageX - touch2.pageX, 2) +
                Math.pow(touch1.pageY - touch2.pageY, 2)
              );
              
              // Update scale based on pinch distance
              if ((gestureState as any).previousPinchDistance) {
                const scaleChange = currentDistance / (gestureState as any).previousPinchDistance;
                const newScale = Math.min(Math.max(scale * scaleChange, 1), 3);
                setScale(newScale);
                
                // When zoomed, allow panning
                if (newScale > 1) {
                  toggleZoom(true);
                } else {
                  toggleZoom(false);
                }
              }
              
              // Save for next comparison
              (gestureState as any).previousPinchDistance = currentDistance;
            }
          }
        } 
        // Handle panning when zoomed
        else if (isZoomed && gestureState.numberActiveTouches === 1) {
          setTranslateX(prev => prev + gestureState.dx / scale);
          setTranslateY(prev => prev + gestureState.dy / scale);
        }
      },
      
      onPanResponderRelease: () => {
        // End of gesture - we don't need to do anything special here
        // previousPinchDistance will be reset on the next gesture start
      }
    })
  ).current;

  return (
    <View style={styles.container}>
      {/* Image in scrollview for swipe-to-close and vertical scrolling */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        pagingEnabled
        nestedScrollEnabled={true}
        directionalLockEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isZoomed}  // Disable scroll when zoomed to allow panning
        {...(swipeToCloseEnabled && {
          onScroll,
          onScrollEndDrag,
        })}
        scrollEventThrottle={16}
      >
        {/* Top spacer for vertical scrolling */}
        <View style={{ height: layout.height }} />
        
        {/* Main content area */}
        <View
          style={{
            width: layout.width, 
            height: Math.max(imageHeight, layout.height),
            justifyContent: 'center',
            alignItems: 'center',
          }}
          {...panResponder.panHandlers}
        >
          {/* Tap handler layer */}
          <TouchableWithoutFeedback
            onPress={handleTap}
            onLongPress={handleLongPress}
            delayLongPress={delayLongPress}
          >
            <View style={styles.imageContainer}>
              {/* Main image */}
              <Animated.View
                style={{
                  width: layout.width,
                  height: imageHeight,
                  transform: [
                    { scale },
                    { translateX },
                    { translateY }
                  ]
                }}
              >
                <ExpoImage
                  source={imageSrc}
                  style={styles.image}
                  contentFit="contain"
                  contentPosition="center"
                  onLoad={onImageLoaded}
                />
              </Animated.View>
            </View>
          </TouchableWithoutFeedback>
        </View>
        
        {/* Bottom spacer for vertical scrolling */}
        <View style={{ height: layout.height }} />
      </ScrollView>
      
      {/* Loading indicator */}
      {!isLoaded && <ImageLoading />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  scrollView: {
    width: "100%",
    height: "100%",
  },
  scrollViewContent: {
    // 300% height to allow content above and below for swipe to close
    height: "300%",
  },
  imageContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
});

export default React.memo(ImageItem);
