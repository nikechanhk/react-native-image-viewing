/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import React, { useCallback, useRef, useState, useEffect } from "react";
import { View, Animated, ScrollView, StyleSheet, TouchableWithoutFeedback, PanResponder, } from "react-native";
import useImageDimensions from "../../hooks/useImageDimensions";
import { ImageLoading } from "./ImageLoading";
import { Image as ExpoImage } from "expo-image";
// Constants
const SWIPE_CLOSE_VELOCITY = 1.75;
const MAX_SCALE = 3; // Maximum zoom level
const MIN_SCALE = 1; // Minimum zoom level
const ImageItem = ({ imageSrc, onZoom, onRequestClose, onLongPress, delayLongPress, swipeToCloseEnabled = true, currentImageIndex, layout, onSingleTap, }) => {
    // Refs for handling pinch state
    const scrollViewRef = useRef(null);
    const pinchStateRef = useRef({});
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
    // Handle image load completion
    const onImageLoaded = useCallback(() => {
        setIsLoaded(true);
    }, []);
    // Toggle zoom state
    const toggleZoom = useCallback((zoomed) => {
        setIsZoomed(zoomed);
        onZoom(zoomed);
        // Update scroll enabled state
        if (scrollViewRef.current && scrollViewRef.current.setNativeProps) {
            scrollViewRef.current.setNativeProps({
                scrollEnabled: !zoomed
            });
        }
    }, [onZoom]);
    // Reset on orientation change or image change
    useEffect(() => {
        // Reset zoom state, scale and position
        toggleZoom(false);
        setScale(1);
        setTranslateX(0);
        setTranslateY(0);
        // Reset scroll position to center
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ y: layout.height, animated: false });
        }
    }, [layout.width, layout.height, currentImageIndex]);
    // Handle long press
    const handleLongPress = useCallback(() => {
        onLongPress(imageSrc);
    }, [imageSrc, onLongPress]);
    // Handle tap (simplified to just call onSingleTap)
    const handleTap = useCallback(() => {
        if (onSingleTap) {
            onSingleTap();
        }
    }, [onSingleTap]);
    // Handle scroll end for swipe-to-close
    const onScrollEndDrag = useCallback((event) => {
        var _a;
        if (!swipeToCloseEnabled)
            return;
        const offsetY = event.nativeEvent.contentOffset.y;
        const velocityY = Math.abs(((_a = event.nativeEvent.velocity) === null || _a === void 0 ? void 0 : _a.y) || 0);
        // Close the viewer if we've scrolled far enough with enough velocity
        if (velocityY > SWIPE_CLOSE_VELOCITY &&
            (offsetY < layout.height * 0.6 || offsetY > layout.height * 1.4)) {
            onRequestClose();
            return;
        }
        // Reset to center position if not closing
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({
                y: layout.height,
                animated: true,
            });
        }
    }, [layout.height, swipeToCloseEnabled, onRequestClose]);
    // State for tracking last positions
    const lastPositionRef = useRef({ x: 0, y: 0 });
    // Set up pan responder for touch handling
    const panResponder = useRef(PanResponder.create({
        // Always attempt to become responder on touch start
        onStartShouldSetPanResponder: () => true,
        // Take over for multi-touch or when zoomed
        onMoveShouldSetPanResponder: (evt, gestureState) => {
            // Allow for pinch zooming (2 fingers) or panning when zoomed (1 finger)
            return gestureState.numberActiveTouches === 2 ||
                (isZoomed && gestureState.numberActiveTouches === 1);
        },
        // Initialize gesture state
        onPanResponderGrant: (evt, gestureState) => {
            // Store current position and scale at start of gesture
            lastPositionRef.current = {
                x: translateX,
                y: translateY
            };
            // For pinch gesture
            if (gestureState.numberActiveTouches === 2) {
                pinchStateRef.current = {
                    initialScale: scale,
                    initialDistance: undefined // Will be set on first move
                };
            }
        },
        // Handle gestures
        onPanResponderMove: (evt, gestureState) => {
            // PINCH TO ZOOM - two fingers
            if (gestureState.numberActiveTouches === 2) {
                const touches = evt.nativeEvent.touches;
                if (touches && touches.length >= 2) {
                    const touch1 = touches[0];
                    const touch2 = touches[1];
                    // Calculate distance between touch points
                    const currentDistance = Math.sqrt(Math.pow(touch1.pageX - touch2.pageX, 2) +
                        Math.pow(touch1.pageY - touch2.pageY, 2));
                    // Set initial distance on first move
                    if (!pinchStateRef.current.initialDistance) {
                        pinchStateRef.current.initialDistance = currentDistance;
                        return;
                    }
                    // Calculate new scale
                    const initialDistance = pinchStateRef.current.initialDistance;
                    const initialScale = pinchStateRef.current.initialScale || 1;
                    // Apply scale with constraints
                    const newScale = Math.min(Math.max(initialScale * (currentDistance / initialDistance), MIN_SCALE), MAX_SCALE);
                    // Update scale
                    setScale(newScale);
                    // Update zoom state
                    if (newScale > 1) {
                        toggleZoom(true);
                    }
                    else {
                        toggleZoom(false);
                        // Reset position when zooming out completely
                        if (newScale === 1) {
                            setTranslateX(0);
                            setTranslateY(0);
                        }
                    }
                }
            }
            // PAN - single finger when zoomed
            else if (isZoomed && gestureState.numberActiveTouches === 1) {
                // Calculate new position
                const newTranslateX = lastPositionRef.current.x + gestureState.dx / scale;
                const newTranslateY = lastPositionRef.current.y + gestureState.dy / scale;
                // Apply translation
                setTranslateX(newTranslateX);
                setTranslateY(newTranslateY);
            }
        },
        // End of gesture
        onPanResponderRelease: () => {
            // Simply preserve the current state - no reset needed
        }
    })).current;
    return (<View style={styles.container}>
      {/* Image in scrollview for swipe-to-close and vertical scrolling */}
      <ScrollView ref={scrollViewRef} style={styles.scrollView} contentContainerStyle={styles.scrollViewContent} pagingEnabled nestedScrollEnabled={true} directionalLockEnabled={false} showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false} scrollEnabled={!isZoomed} // Disable scroll when zoomed to allow panning
     onScrollEndDrag={swipeToCloseEnabled ? onScrollEndDrag : undefined} scrollEventThrottle={16}>
        {/* Top spacer for vertical scrolling */}
        <View style={{ height: layout.height }}/>
        
        {/* Main content area */}
        <View style={{
            width: layout.width,
            height: Math.max(imageHeight, layout.height),
            justifyContent: 'center',
            alignItems: 'center',
        }} {...panResponder.panHandlers}>
          {/* Tap handler layer */}
          <TouchableWithoutFeedback onPress={handleTap} onLongPress={handleLongPress} delayLongPress={delayLongPress}>
            <View style={styles.imageContainer}>
              {/* Main image with transform for zoom and pan */}
              <Animated.View style={{
            width: layout.width,
            height: imageHeight,
            transform: [
                { scale },
                { translateX },
                { translateY }
            ]
        }}>
                <ExpoImage source={imageSrc} style={styles.image} contentFit="contain" contentPosition="center" onLoad={onImageLoaded}/>
              </Animated.View>
            </View>
          </TouchableWithoutFeedback>
        </View>
        
        {/* Bottom spacer for vertical scrolling */}
        <View style={{ height: layout.height }}/>
      </ScrollView>
      
      {/* Loading indicator */}
      {!isLoaded && <ImageLoading />}
    </View>);
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
