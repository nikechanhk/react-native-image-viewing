/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import React, { useCallback, useRef, useState } from "react";
import { View, Animated, StyleSheet, PanResponder, } from "react-native";
import useImageDimensions from "../../hooks/useImageDimensions";
import { ImageLoading } from "./ImageLoading";
import { Image as ExpoImage } from "expo-image";
// Constants
const MAX_SCALE = 3; // Maximum zoom level
const MIN_SCALE = 1; // Minimum zoom level
const ImageItem = ({ imageSrc, onZoom, onLongPress, delayLongPress, currentImageIndex, layout, onSingleTap, }) => {
    // Animated values for transformations
    const scale = useRef(new Animated.Value(1)).current;
    const translateX = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;
    // State
    const [isLoaded, setIsLoaded] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
    // Gesture state references for touch handling
    const gestureState = useRef({
        lastScale: 1,
        lastTranslateX: 0,
        lastTranslateY: 0,
        initialTouchDistance: 0,
        initialTouchX: 0,
        initialTouchY: 0,
        pinchTouches: [],
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
    // Update zoom state
    const updateZoomState = useCallback((newScale) => {
        const wasZoomed = isZoomed;
        const nowZoomed = newScale > 1.05;
        if (wasZoomed !== nowZoomed) {
            setIsZoomed(nowZoomed);
            if (onZoom)
                onZoom(nowZoomed);
        }
    }, [isZoomed, onZoom]);
    // Function to calculate distance between two touch points
    const calculateDistance = (touches) => {
        if (touches.length < 2)
            return 0;
        const dx = touches[1].pageX - touches[0].pageX;
        const dy = touches[1].pageY - touches[0].pageY;
        return Math.sqrt(dx * dx + dy * dy);
    };
    // Handle long press
    const handleLongPress = useCallback(() => {
        if (onLongPress)
            onLongPress(imageSrc);
    }, [imageSrc, onLongPress]);
    // Handle tap
    const handleTap = useCallback(() => {
        if (onSingleTap) {
            onSingleTap();
        }
    }, [onSingleTap]);
    // Simple pan responder for handling gestures
    const panResponder = useRef(PanResponder.create({
        // Capture all touches
        onStartShouldSetPanResponder: () => true,
        // Only handle when zoomed or multi-touch
        onMoveShouldSetPanResponder: (_, gs) => {
            return gs.numberActiveTouches >= 2 || (isZoomed && gs.numberActiveTouches === 1);
        },
        // When gesture starts
        onPanResponderGrant: (evt) => {
            const touches = evt.nativeEvent.touches;
            // Store current values
            scale.stopAnimation();
            translateX.stopAnimation();
            translateY.stopAnimation();
            scale.extractOffset();
            translateX.extractOffset();
            translateY.extractOffset();
            // Set reference values
            gestureState.current.lastScale = 1;
            gestureState.current.lastTranslateX = 0;
            gestureState.current.lastTranslateY = 0;
            // For pinch
            if (touches.length >= 2) {
                gestureState.current.pinchTouches = touches;
                gestureState.current.initialTouchDistance = calculateDistance(touches);
                // Store center point
                const touch1 = touches[0];
                const touch2 = touches[1];
                gestureState.current.initialTouchX = (touch1.pageX + touch2.pageX) / 2;
                gestureState.current.initialTouchY = (touch1.pageY + touch2.pageY) / 2;
            }
        },
        // During gesture
        onPanResponderMove: (evt, gs) => {
            const touches = evt.nativeEvent.touches;
            // PINCH ZOOM
            if (touches.length >= 2) {
                const currentDistance = calculateDistance(touches);
                const initialDistance = gestureState.current.initialTouchDistance;
                if (initialDistance === 0)
                    return;
                // Calculate new scale
                let newScale = currentDistance / initialDistance;
                newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));
                // Apply scale
                scale.setValue(newScale);
                // Handle panning during pinch
                const touch1 = touches[0];
                const touch2 = touches[1];
                const currentTouchX = (touch1.pageX + touch2.pageX) / 2;
                const currentTouchY = (touch1.pageY + touch2.pageY) / 2;
                const dx = currentTouchX - gestureState.current.initialTouchX;
                const dy = currentTouchY - gestureState.current.initialTouchY;
                translateX.setValue(dx / 2);
                translateY.setValue(dy / 2);
                // Update zoom state
                updateZoomState(newScale);
            }
            // SINGLE FINGER PAN WHEN ZOOMED
            else if (isZoomed && touches.length === 1) {
                // Apply translation
                translateX.setValue(gs.dx / 2);
                translateY.setValue(gs.dy / 2);
            }
        },
        // End of gesture
        onPanResponderRelease: () => {
            // Commit offsets
            scale.flattenOffset();
            translateX.flattenOffset();
            translateY.flattenOffset();
            // Check if we need to reset to default scale
            let currentScaleVal = 1;
            scale.addListener(({ value }) => {
                currentScaleVal = value;
            });
            if (currentScaleVal < 1.05) {
                Animated.parallel([
                    Animated.timing(scale, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateX, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateY, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true,
                    })
                ]).start(() => {
                    updateZoomState(1);
                });
            }
        },
    })).current;
    return (<View style={styles.container}>
      <View style={{
            width: layout.width,
            height: layout.height,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#000',
        }} {...panResponder.panHandlers}>
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
      
      {/* Loading indicator */}
      {!isLoaded && <ImageLoading />}
    </View>);
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    image: {
        width: '100%',
        height: '100%',
    },
});
export default React.memo(ImageItem);
