/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { Platform } from "react-native";
const useImageIndexChange = (initialIndex, layout, onIndexChange) => {
    // Track the current index internally
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    // Refs for tracking scroll state
    const lastScrollX = useRef(0);
    const isInitializing = useRef(true);
    const initialLayoutWidth = useRef(null);
    const scrollEndTimeoutRef = useRef(null);
    const isPortrait = useRef(layout.height > layout.width);
    // Set initial layout width and orientation
    useEffect(() => {
        if (layout.width > 0 && initialLayoutWidth.current === null) {
            initialLayoutWidth.current = layout.width;
            isPortrait.current = layout.height > layout.width;
            // Wait for initial layout and scroll to complete
            const timer = setTimeout(() => {
                isInitializing.current = false;
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [layout.width, layout.height]);
    // Update both internal state and notify parent via callback
    const updateIndex = useCallback((newIndex) => {
        if (newIndex >= 0 && newIndex !== currentIndex) {
            setCurrentIndex(newIndex);
            if (onIndexChange) {
                onIndexChange(newIndex);
            }
        }
    }, [currentIndex, onIndexChange]);
    // Handle scroll events
    const onScroll = useCallback((event) => {
        const { nativeEvent: { contentOffset: { x: scrollX }, layoutMeasurement: { width: measurementWidth }, }, } = event;
        // Store the last scroll position
        lastScrollX.current = scrollX;
        // Ignore scroll events during initialization or if width is invalid
        if (isInitializing.current || measurementWidth <= 0) {
            return;
        }
        // Calculate the current image index based on scroll position
        const calculatedIndex = Math.round(scrollX / measurementWidth);
        // Handle iOS portrait mode specifically
        if (Platform.OS === 'ios' && isPortrait.current) {
            // Always update the index immediately for iOS in portrait
            if (calculatedIndex >= 0) {
                updateIndex(calculatedIndex);
            }
            // Also set a timeout to ensure the final position is captured
            if (scrollEndTimeoutRef.current) {
                clearTimeout(scrollEndTimeoutRef.current);
            }
            scrollEndTimeoutRef.current = setTimeout(() => {
                const finalIndex = Math.round(lastScrollX.current / measurementWidth);
                if (finalIndex >= 0) {
                    updateIndex(finalIndex);
                }
                scrollEndTimeoutRef.current = null;
            }, 50);
        }
        else {
            // For Android or iOS landscape, update when index changes
            if (calculatedIndex >= 0 && calculatedIndex !== currentIndex) {
                updateIndex(calculatedIndex);
            }
        }
    }, [currentIndex, updateIndex]);
    // Track orientation changes
    useEffect(() => {
        if (layout.width > 0 && layout.height > 0) {
            isPortrait.current = layout.height > layout.width;
        }
    }, [layout.width, layout.height]);
    // Reset initialization when layout changes significantly
    useEffect(() => {
        if (initialLayoutWidth.current &&
            Math.abs(layout.width - initialLayoutWidth.current) > 50) {
            isInitializing.current = true;
            initialLayoutWidth.current = layout.width;
            isPortrait.current = layout.height > layout.width;
            // Reset after layout change
            const timer = setTimeout(() => {
                isInitializing.current = false;
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [layout.width, layout.height]);
    // Clean up timeout on unmount
    useEffect(() => {
        return () => {
            if (scrollEndTimeoutRef.current) {
                clearTimeout(scrollEndTimeoutRef.current);
            }
        };
    }, []);
    // Return current index and scroll handler
    return [currentIndex, onScroll];
};
export default useImageIndexChange;
