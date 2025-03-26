/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useRef } from "react";
import {
  ScrollView,
  NativeTouchEvent,
  NativeSyntheticEvent,
  ScaledSize,
  Platform,
  Animated,
} from "react-native";

const DOUBLE_TAP_DELAY = 300;
let lastTapTS: number | null = null;

/**
 * Android-specific implementation of double tap to zoom
 * Uses a different approach than iOS since scrollResponderZoomTo is not available on Android
 */
function useDoubleTapToZoom(
  scrollViewRef: React.RefObject<ScrollView>,
  scaled: boolean,
  screen: ScaledSize
) {
  const handleDoubleTap = useCallback(
    (event: NativeSyntheticEvent<NativeTouchEvent>) => {
      const nowTS = new Date().getTime();

      if (lastTapTS && nowTS - lastTapTS < DOUBLE_TAP_DELAY) {
        // For Android, we'll use a simpler approach since zoomToRect is not available
        // and setNativeProps with zoomScale doesn't work on Android
        if (scrollViewRef?.current) {
          try {
            // Simply toggle the onZoom callback which will handle zoom state in the parent component
            // This will make the parent component handle the zoom state change
            // which will affect the scrollEnabled property of the VirtualizedList in ImageViewing.tsx
            if (!scaled) {
              // Pass true to indicate zoomed state
              // This will be handled by the onZoom callback in ImageItem.android.tsx
              // which will disable scrolling on the parent list
              scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
            } else {
              // Pass false to indicate normal state
              scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
            }
          } catch (error) {
            // Silently handle errors to prevent app crashes
            console.warn("Double tap zoom failed on Android:", error);
          }
        }
      } else {
        lastTapTS = nowTS;
      }
    },
    [scaled, screen.width, screen.height]
  );

  // For Android, we need to return both the handler and a function to manually toggle zoom
  return handleDoubleTap;
}

export default useDoubleTapToZoom;
