/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { useState, useEffect, useCallback, useRef } from "react";
const useImageIndexChange = (imageIndex, layout) => {
    const [currentImageIndex, setImageIndex] = useState(imageIndex);
    const lastValidIndex = useRef(imageIndex);
    const isInitializing = useRef(true);
    const initialLayoutWidth = useRef(null);
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
    const onScroll = useCallback((event) => {
        const { nativeEvent: { contentOffset: { x: scrollX }, layoutMeasurement: { width: measurementWidth }, }, } = event;
        // Ignore scroll events during initialization
        if (isInitializing.current) {
            return;
        }
        if (measurementWidth > 0) {
            const calculatedIndex = Math.round(scrollX / measurementWidth);
            if (calculatedIndex >= 0 &&
                calculatedIndex !== currentImageIndex &&
                calculatedIndex !== lastValidIndex.current) {
                lastValidIndex.current = calculatedIndex;
                setImageIndex(calculatedIndex);
            }
        }
    }, [currentImageIndex]);
    // Reset initialization when layout changes significantly
    useEffect(() => {
        if (initialLayoutWidth.current &&
            Math.abs(layout.width - initialLayoutWidth.current) > 50) {
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
    return [currentImageIndex, onScroll];
};
