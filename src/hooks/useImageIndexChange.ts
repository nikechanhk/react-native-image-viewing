/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState, useEffect } from "react";
import { NativeSyntheticEvent, NativeScrollEvent, ScaledSize } from "react-native";

// Enhanced hook to handle orientation changes better
const useImageIndexChange = (imageIndex: number, screen: ScaledSize) => {
  const [currentImageIndex, setImageIndex] = useState(imageIndex);
  
  // Update current index when imageIndex prop changes
  useEffect(() => {
    setImageIndex(imageIndex);
  }, [imageIndex]);
  
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const {
      nativeEvent: {
        contentOffset: { x: scrollX },
        layoutMeasurement: { width: layoutWidth },
      },
    } = event;

    // Using layoutMeasurement from the event instead of screen width
    // This ensures we always have the most up-to-date dimensions
    // even during orientation changes
    if (layoutWidth) {
      const nextIndex = Math.round(scrollX / layoutWidth);
      if (nextIndex >= 0 && nextIndex !== currentImageIndex) {
        setImageIndex(nextIndex);
      }
    }
  };

  return [currentImageIndex, onScroll] as const;
};

export default useImageIndexChange;
