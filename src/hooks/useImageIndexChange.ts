/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { NativeSyntheticEvent, NativeScrollEvent } from "react-native";

import { Dimensions } from "../@types";

const useImageIndexChange = (imageIndex: number, layout: Dimensions) => {
  const [currentImageIndex, setImageIndex] = useState(imageIndex);
  const lastValidIndex = useRef(imageIndex);
  const isInitializing = useRef(true);
  const initialLayoutWidth = useRef<number | null>(null);

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

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const {
        nativeEvent: {
          contentOffset: { x: scrollX },
          layoutMeasurement: { width: measurementWidth },
        },
      } = event;

      // Ignore scroll events during initialization
      if (isInitializing.current) {
        return;
      }

      if (measurementWidth > 0) {
        const calculatedIndex = Math.round(scrollX / measurementWidth);

        // Ensure valid index and prevent duplicate updates
        if (calculatedIndex >= 0) {
          // Always update the lastValidIndex for tracking
          lastValidIndex.current = calculatedIndex;
          
          // Only trigger state update if index has changed
          if (calculatedIndex !== currentImageIndex) {
            setImageIndex(calculatedIndex);
          }
        }
      }
    },
    [currentImageIndex]
  );

  // Reset initialization when layout changes significantly
  useEffect(() => {
    if (
      initialLayoutWidth.current && 
      Math.abs(layout.width - initialLayoutWidth.current) > 50
    ) {
      isInitializing.current = true;
      initialLayoutWidth.current = layout.width;
      // Preserve the current index during orientation change
      lastValidIndex.current = currentImageIndex;
      // Reset after layout change
      const timer = setTimeout(() => {
        isInitializing.current = false;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [layout.width, currentImageIndex]);

  return [currentImageIndex, onScroll] as const;
};

export default useImageIndexChange;
