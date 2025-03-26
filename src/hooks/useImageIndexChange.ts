/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { NativeSyntheticEvent, NativeScrollEvent, Platform } from "react-native";

import { Dimensions } from "../@types";

type IndexChangeCallback = (index: number) => void;

const useImageIndexChange = (
  initialIndex: number, 
  layout: Dimensions,
  onIndexChange?: IndexChangeCallback
) => {
  // Track the current index internally
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  
  // Refs for tracking scroll state
  const lastScrollX = useRef(0);
  const isInitializing = useRef(true);
  const initialLayoutWidth = useRef<number | null>(null);
  const scrollEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  
  // Always update orientation when dimensions change
  useEffect(() => {
    if (layout.width > 0 && layout.height > 0) {
      const newIsPortrait = layout.height > layout.width;
      if (isPortrait.current !== newIsPortrait) {
        isPortrait.current = newIsPortrait;
        console.log(`Orientation changed to: ${newIsPortrait ? 'portrait' : 'landscape'}`);
      }
    }
  }, [layout.width, layout.height]);

  // Update both internal state and notify parent via callback
  const updateIndex = useCallback((newIndex: number) => {
    if (newIndex >= 0 && newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      if (onIndexChange) {
        onIndexChange(newIndex);
      }
    }
  }, [currentIndex, onIndexChange]);

  // Handle scroll events
  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const {
        nativeEvent: {
          contentOffset: { x: scrollX },
          layoutMeasurement: { width: measurementWidth },
        },
      } = event;

      // Store the last scroll position
      lastScrollX.current = scrollX;

      // Ignore scroll events during initialization or if width is invalid
      if (isInitializing.current || measurementWidth <= 0) {
        return;
      }

      // Calculate the current image index based on scroll position
      const calculatedIndex = Math.round(scrollX / measurementWidth);
      
      // Always update the index for iOS regardless of orientation
      // This ensures consistent behavior when orientation changes
      if (Platform.OS === 'ios') {
        // Always update the index immediately
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
      } else {
        // For Android, update when index changes
        if (calculatedIndex >= 0 && calculatedIndex !== currentIndex) {
          updateIndex(calculatedIndex);
        }
      }
    },
    [currentIndex, updateIndex]
  );



  // Reset initialization when layout changes significantly
  useEffect(() => {
    if (
      initialLayoutWidth.current && 
      Math.abs(layout.width - initialLayoutWidth.current) > 50
    ) {
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
  return [currentIndex, onScroll] as const;
};

export default useImageIndexChange;
