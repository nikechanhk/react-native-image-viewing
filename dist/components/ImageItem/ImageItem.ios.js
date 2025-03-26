/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import React, { useCallback, useRef, useState, useEffect } from "react";
import { Animated, ScrollView, StyleSheet, View, TouchableWithoutFeedback, } from "react-native";
import useDoubleTapToZoom from "../../hooks/useDoubleTapToZoom";
import useImageDimensions from "../../hooks/useImageDimensions";
import { getImageStyles, getImageTransform } from "../../utils";
import { ImageLoading } from "./ImageLoading";
import { Image as ExpoImage } from "expo-image";
const SWIPE_CLOSE_OFFSET = 75;
const SWIPE_CLOSE_VELOCITY = 1.55;
// Props type is now imported from ImageItem.d.ts
const ImageItem = ({ imageSrc, onZoom, onRequestClose, onLongPress, delayLongPress, swipeToCloseEnabled = true, doubleTapToZoomEnabled = true, currentImageIndex, layout, }) => {
    const scrollViewRef = useRef(null);
    const [loaded, setLoaded] = useState(false);
    const [scaled, setScaled] = useState(false);
    const imageDimensions = useImageDimensions(imageSrc) || { width: 0, height: 0 };
    const handleDoubleTap = useDoubleTapToZoom(scrollViewRef, scaled, layout);
    // Reset scroll view when layout changes (orientation change)
    useEffect(() => {
        if (scrollViewRef.current && !scaled) {
            // Reset zoom and position when orientation changes
            scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: false });
            // Reset scale when orientation changes
            translateValue.setValue(translate);
            scaleValue.setValue(scale || 1);
        }
    }, [layout.width, layout.height, scaled]);
    const [translate, scale] = getImageTransform(imageDimensions, { width: layout.width, height: layout.height });
    const scrollValueY = new Animated.Value(0);
    const scaleValue = new Animated.Value(scale || 1);
    const translateValue = new Animated.ValueXY(translate);
    const maxScale = scale && scale > 0 ? Math.max(1 / scale, 1) : 1;
    const imageOpacity = scrollValueY.interpolate({
        inputRange: [-SWIPE_CLOSE_OFFSET, 0, SWIPE_CLOSE_OFFSET],
        outputRange: [0.5, 1, 0.5],
    });
    const imagesStyles = getImageStyles(imageDimensions, translateValue, scaleValue);
    const imageStylesWithOpacity = { ...imagesStyles, opacity: imageOpacity };
    const onScrollEndDrag = useCallback(({ nativeEvent }) => {
        var _a, _b;
        const velocityY = (_b = (_a = nativeEvent === null || nativeEvent === void 0 ? void 0 : nativeEvent.velocity) === null || _a === void 0 ? void 0 : _a.y) !== null && _b !== void 0 ? _b : 0;
        const scaled = (nativeEvent === null || nativeEvent === void 0 ? void 0 : nativeEvent.zoomScale) > 1;
        onZoom(scaled);
        setScaled(scaled);
        if (!scaled &&
            swipeToCloseEnabled &&
            Math.abs(velocityY) > SWIPE_CLOSE_VELOCITY) {
            onRequestClose();
        }
    }, [scaled]);
    const onScroll = ({ nativeEvent, }) => {
        var _a, _b;
        const offsetY = (_b = (_a = nativeEvent === null || nativeEvent === void 0 ? void 0 : nativeEvent.contentOffset) === null || _a === void 0 ? void 0 : _a.y) !== null && _b !== void 0 ? _b : 0;
        if ((nativeEvent === null || nativeEvent === void 0 ? void 0 : nativeEvent.zoomScale) > 1) {
            return;
        }
        scrollValueY.setValue(offsetY);
    };
    const onLongPressHandler = useCallback((event) => {
        onLongPress(imageSrc);
    }, [imageSrc, onLongPress]);
    return (<View style={{ width: layout.width, height: layout.height }}>
      <ScrollView ref={scrollViewRef} style={styles.listItem} pinchGestureEnabled showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false} maximumZoomScale={maxScale} contentContainerStyle={styles.imageScrollContainer} scrollEnabled={swipeToCloseEnabled} onScrollEndDrag={onScrollEndDrag} scrollEventThrottle={1} {...(swipeToCloseEnabled && {
        onScroll,
    })}>
        {(!loaded || !imageDimensions) && <ImageLoading />}
        <TouchableWithoutFeedback onPress={doubleTapToZoomEnabled ? handleDoubleTap : undefined} onLongPress={onLongPressHandler} delayLongPress={delayLongPress}>
          <Animated.View style={imageStylesWithOpacity}>
            <ExpoImage source={imageSrc} style={{
            width: layout.width,
            height: layout.height,
        }} contentFit="contain" onLoad={() => setLoaded(true)}/>
          </Animated.View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </View>);
};
const styles = StyleSheet.create({
    listItem: {
        width: "100%",
        height: "100%",
        flex: 1,
    },
    imageScrollContainer: {
        width: "100%",
        height: "100%",
        alignItems: 'center',
        justifyContent: 'center',
    },
});
export default React.memo(ImageItem);
