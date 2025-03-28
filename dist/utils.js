/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
// @ts-nocheck
import { Animated, PanResponder, } from "react-native";
export const createCache = (cacheSize) => ({
    _storage: [],
    get(key) {
        const { value } = this._storage.find(({ key: storageKey }) => storageKey === key) || {};
        return value;
    },
    set(key, value) {
        if (this._storage.length >= cacheSize) {
            this._storage.shift();
        }
        this._storage.push({ key, value });
    },
});
export const splitArrayIntoBatches = (arr, batchSize) => arr.reduce((result, item) => {
    const batch = result.pop() || [];
    if (batch.length < batchSize) {
        batch.push(item);
        result.push(batch);
    }
    else {
        result.push(batch, [item]);
    }
    return result;
}, []);
export const getImageTransform = (image, screen) => {
    if (!(image === null || image === void 0 ? void 0 : image.width) || !(image === null || image === void 0 ? void 0 : image.height)) {
        // Return default values when image dimensions are not available
        return [{ x: 0, y: 0 }, 1];
    }
    const wScale = screen.width / image.width;
    const hScale = screen.height / image.height;
    const scale = Math.min(wScale, hScale);
    const { x, y } = getImageTranslate(image, screen);
    return [{ x, y }, scale];
};
export const getImageStyles = (image, translate, scale) => {
    if (!(image === null || image === void 0 ? void 0 : image.width) || !(image === null || image === void 0 ? void 0 : image.height)) {
        return { width: 0, height: 0 };
    }
    const transform = translate.getTranslateTransform();
    if (scale) {
        transform.push({ scale }, { perspective: new Animated.Value(1000) });
    }
    return {
        width: image.width,
        height: image.height,
        transform,
    };
};
export const getImageTranslate = (image, screen) => {
    // Handle case where image dimensions are zero
    if (!(image === null || image === void 0 ? void 0 : image.width) || !(image === null || image === void 0 ? void 0 : image.height)) {
        return { x: 0, y: 0 };
    }
    const getTranslateForAxis = (axis) => {
        const imageSize = axis === "x" ? image.width : image.height;
        const screenSize = axis === "x" ? screen.width : screen.height;
        return (screenSize - imageSize) / 2;
    };
    return {
        x: getTranslateForAxis("x"),
        y: getTranslateForAxis("y"),
    };
};
export const getImageDimensionsByTranslate = (translate, screen) => ({
    width: screen.width - translate.x * 2,
    height: screen.height - translate.y * 2,
});
export const getImageTranslateForScale = (currentTranslate, targetScale, screen) => {
    const { width, height } = getImageDimensionsByTranslate(currentTranslate, screen);
    const targetImageDimensions = {
        width: width * targetScale,
        height: height * targetScale,
    };
    return getImageTranslate(targetImageDimensions, screen);
};
export const createPanResponder = ({ onGrant, onStart, onMove, onRelease, onTerminate, }) => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderGrant: onGrant,
    onPanResponderStart: onStart,
    onPanResponderMove: onMove,
    onPanResponderRelease: onRelease,
    onPanResponderTerminate: onTerminate,
    onPanResponderTerminationRequest: () => false,
    onShouldBlockNativeResponder: () => false,
});
export const getDistanceBetweenTouches = (touches) => {
    const [a, b] = touches;
    if (a == null || b == null) {
        return 0;
    }
    return Math.sqrt(Math.pow(a.pageX - b.pageX, 2) + Math.pow(a.pageY - b.pageY, 2));
};
