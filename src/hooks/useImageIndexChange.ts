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

const useImageIndexChange = (imageIndex: number, layout: Dimensions) => {
  const [currentImageIndex, setImageIndex] = useState(imageIndex);
  const lastScrollX = useRef(0);
  const isInitializing = useRef(true);
  const initialLayoutWidth = useRef<number | null>(null);
  const scrollEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Set initial layout width
  useEffect(() => {
    if (layout.width > 0 && initialLayoutWidth.current === null) {
      initialLayoutWidth.current = layout.width;
      // Wait for initial layout and scroll to complete
      const timer = setTimeout(() => {
        isInitializing.current = false;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [layout.width]);

  const updateIndex = useCallback((newIndex: number) => {
    if (newIndex >= 0 && newIndex !== currentImageIndex) {
      setImageIndex(newIndex);
    }
  }, [currentImageIndex]);

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

      // Ignore scroll events during initialization
      if (isInitializing.current || measurementWidth <= 0) {
        return;
      }

      // Calculate the current image index based on scroll position
      const calculatedIndex = Math.round(scrollX / measurementWidth);
      
      // For iOS in portrait, we need to be more aggressive with updates
      if (Platform.OS === 'ios') {
        // Clear any existing timeout
        if (scrollEndTimeoutRef.current) {
          clearTimeout(scrollEndTimeoutRef.current);
        }
        
        // Set a timeout to update the index after scrolling stops
        scrollEndTimeoutRef.current = setTimeout(() => {
          const finalIndex = Math.round(lastScrollX.current / measurementWidth);
          updateIndex(finalIndex);
          scrollEndTimeoutRef.current = null;
        }, 50);
        
        // Also update immediately if the calculated index is different
        if (calculatedIndex >= 0 && calculatedIndex !== currentImageIndex) {
          updateIndex(calculatedIndex);
        }
      } else {
        // For Android, just update when the index changes
        if (calculatedIndex >= 0 && calculatedIndex !== currentImageIndex) {
          updateIndex(calculatedIndex);
        }
      }
    },
    [currentImageIndex, updateIndex]
  );

  // Reset initialization when layout changes significantly
  useEffect(() => {
    if (
      initialLayoutWidth.current && 
      Math.abs(layout.width - initialLayoutWidth.current) > 50
    ) {
      isInitializing.current = true;
      initialLayoutWidth.current = layout.width;
      // Reset after layout change
      const timer = setTimeout(() => {
        isInitializing.current = false;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [layout.width]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollEndTimeoutRef.current) {
        clearTimeout(scrollEndTimeoutRef.current);
      }
    };
  }, []);

  return [currentImageIndex, onScroll] as const;
};

export default useImageIndexChange;
