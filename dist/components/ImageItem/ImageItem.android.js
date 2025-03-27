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
    // Refs
    const scrollViewRef = useRef(null);
    // Animated values for transformations
    const scaleValue = useRef(new Animated.Value(1)).current;
    const translateXValue = useRef(new Animated.Value(0)).current;
    const translateYValue = useRef(new Animated.Value(0)).current;
    // Track the current values without accessing _value directly
    const currentScale = useRef(1);
    const currentTranslateX = useRef(0);
    const currentTranslateY = useRef(0);
    // Update tracked values when animation values change
    useEffect(() => {
        const scaleListener = scaleValue.addListener(({ value }) => {
            currentScale.current = value;
        });
        const translateXListener = translateXValue.addListener(({ value }) => {
            currentTranslateX.current = value;
        });
        const translateYListener = translateYValue.addListener(({ value }) => {
            currentTranslateY.current = value;
        });
        return () => {
            scaleValue.removeListener(scaleListener);
            translateXValue.removeListener(translateXListener);
            translateYValue.removeListener(translateYListener);
        };
    }, [scaleValue, translateXValue, translateYValue]);
    // State
    const [isLoaded, setIsLoaded] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
    // Gesture state references
    const gestureStateRef = useRef({
        lastScale: 1,
        lastTranslateX: 0,
        lastTranslateY: 0,
        initialTouchDistance: 0,
        initialTouchX: 0,
        initialTouchY: 0,
    });
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
        if (isZoomed !== zoomed) {
            setIsZoomed(zoomed);
            onZoom(zoomed);
            // Disable scroll when zoomed to prevent conflicts with panning
            if (scrollViewRef.current && scrollViewRef.current.setNativeProps) {
                scrollViewRef.current.setNativeProps({
                    scrollEnabled: !zoomed
                });
            }
        }
    }, [isZoomed, onZoom]);
    // Reset everything when image changes or orientation changes
    useEffect(() => {
        // Reset all transformations
        scaleValue.setValue(1);
        translateXValue.setValue(0);
        translateYValue.setValue(0);
        // Reset gesture state
        gestureStateRef.current = {
            lastScale: 1,
            lastTranslateX: 0,
            lastTranslateY: 0,
            initialTouchDistance: 0,
            initialTouchX: 0,
            initialTouchY: 0,
        };
        // Update zoom state
        toggleZoom(false);
        // Reset scroll position to center
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ y: layout.height, animated: false });
        }
    }, [layout.width, layout.height, currentImageIndex, scaleValue, translateXValue, translateYValue, toggleZoom]);
    // Handle long press
    const handleLongPress = useCallback(() => {
        onLongPress(imageSrc);
    }, [imageSrc, onLongPress]);
    // Handle tap
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
    // Set up pan responder for touch handling
    const panResponder = useRef(PanResponder.create({
        // Capture all touch starts
        onStartShouldSetPanResponder: () => true,
        // Begin handling gestures when we have multi-touch or when zoomed
        onMoveShouldSetPanResponder: (evt, gestureState) => {
            const isMultiTouch = gestureState.numberActiveTouches >= 2;
            const isPanningWhenZoomed = isZoomed && Math.abs(gestureState.dx) > 2;
            return isMultiTouch || isPanningWhenZoomed;
        },
        // When gesture begins
        onPanResponderGrant: (evt) => {
            const touches = evt.nativeEvent.touches;
            // Store current transformation values using our tracked refs
            gestureStateRef.current.lastScale = currentScale.current;
            gestureStateRef.current.lastTranslateX = currentTranslateX.current;
            gestureStateRef.current.lastTranslateY = currentTranslateY.current;
            // For pinch gesture, store initial touch positions
            if (touches.length >= 2) {
                const touch1 = touches[0];
                const touch2 = touches[1];
                // Calculate distance between touches for pinch
                gestureStateRef.current.initialTouchDistance = Math.sqrt(Math.pow(touch2.pageX - touch1.pageX, 2) +
                    Math.pow(touch2.pageY - touch1.pageY, 2));
                // Calculate center point between touches for pan during pinch
                gestureStateRef.current.initialTouchX = (touch1.pageX + touch2.pageX) / 2;
                gestureStateRef.current.initialTouchY = (touch1.pageY + touch2.pageY) / 2;
            }
        },
        // Handle the touch movement
        onPanResponderMove: (evt, gestureState) => {
            const touches = evt.nativeEvent.touches;
            // PINCH - Handle two finger gesture for zooming
            if (touches.length >= 2) {
                const touch1 = touches[0];
                const touch2 = touches[1];
                // Calculate current touch distance
                const currentTouchDistance = Math.sqrt(Math.pow(touch2.pageX - touch1.pageX, 2) +
                    Math.pow(touch2.pageY - touch1.pageY, 2));
                // Calculate scale change
                const initialTouchDistance = gestureStateRef.current.initialTouchDistance;
                let newScale = gestureStateRef.current.lastScale * (currentTouchDistance / initialTouchDistance);
                // Apply scale limits
                newScale = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);
                // Update scale
                scaleValue.setValue(newScale);
                // Calculate current touch center point
                const currentTouchX = (touch1.pageX + touch2.pageX) / 2;
                const currentTouchY = (touch1.pageY + touch2.pageY) / 2;
                // Calculate translation changes including scaling effect
                const dx = (currentTouchX - gestureStateRef.current.initialTouchX) / gestureStateRef.current.lastScale;
                const dy = (currentTouchY - gestureStateRef.current.initialTouchY) / gestureStateRef.current.lastScale;
                // Apply translation
                translateXValue.setValue(gestureStateRef.current.lastTranslateX + dx);
                translateYValue.setValue(gestureStateRef.current.lastTranslateY + dy);
                // Update zoom state based on scale
                toggleZoom(newScale > 1.01); // Use a small threshold
            }
            // PAN - Handle one finger gesture for panning when zoomed
            else if (isZoomed && touches.length === 1) {
                // Calculate new position values
                const dx = gestureState.dx / gestureStateRef.current.lastScale;
                const dy = gestureState.dy / gestureStateRef.current.lastScale;
                // Apply translation with scaling factor
                translateXValue.setValue(gestureStateRef.current.lastTranslateX + dx);
                translateYValue.setValue(gestureStateRef.current.lastTranslateY + dy);
            }
        },
        // When touch ends
        onPanResponderRelease: () => {
            // Store final transformation values using our tracked refs
            gestureStateRef.current.lastScale = currentScale.current;
            gestureStateRef.current.lastTranslateX = currentTranslateX.current;
            gestureStateRef.current.lastTranslateY = currentTranslateY.current;
            // If scale is close to 1, snap back to exactly 1 and reset position
            if (gestureStateRef.current.lastScale < 1.05) {
                scaleValue.setValue(1);
                translateXValue.setValue(0);
                translateYValue.setValue(0);
                // Update gesture state
                gestureStateRef.current.lastScale = 1;
                gestureStateRef.current.lastTranslateX = 0;
                gestureStateRef.current.lastTranslateY = 0;
                // Update zoom state
                toggleZoom(false);
            }
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
                { scale: scaleValue },
                { translateX: translateXValue },
                { translateY: translateYValue }
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
