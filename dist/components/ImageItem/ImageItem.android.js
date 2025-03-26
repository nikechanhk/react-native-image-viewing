/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import React, { useCallback, useRef, useState, useMemo } from "react";
import { Animated, ScrollView, View, TouchableWithoutFeedback, } from "react-native";
import useDoubleTapToZoom from "../../hooks/useDoubleTapToZoom";
import useImageDimensions from "../../hooks/useImageDimensions";
import { getImageStyles, getImageTransform } from "../../utils";
import { Image as ExpoImage } from "expo-image";
const SWIPE_CLOSE_OFFSET = 75;
const SWIPE_CLOSE_VELOCITY = 1.75; // Slightly higher threshold for Android
const ImageItem = ({ imageSrc, onZoom, onRequestClose, onLongPress, delayLongPress, swipeToCloseEnabled = true, doubleTapToZoomEnabled = true, currentImageIndex, layout, }) => {
    const scrollViewRef = useRef(null);
    const [loaded, setLoaded] = useState(false);
    const [scaled, setScaled] = useState(false);
    const imageDimensions = useImageDimensions(imageSrc) || { width: 0, height: 0 };
    const handleDoubleTap = useDoubleTapToZoom(scrollViewRef, scaled, layout);
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
    }, [scaled, swipeToCloseEnabled, onRequestClose, onZoom]);
    const onScroll = ({ nativeEvent, }) => {
        var _a, _b, _c;
        const offsetY = (_b = (_a = nativeEvent === null || nativeEvent === void 0 ? void 0 : nativeEvent.contentOffset) === null || _a === void 0 ? void 0 : _a.y) !== null && _b !== void 0 ? _b : 0;
        // On Android, we need to check both zoomScale and contentSize
        // as zoomScale behavior can be inconsistent
        if (((nativeEvent === null || nativeEvent === void 0 ? void 0 : nativeEvent.zoomScale) > 1) ||
            (((_c = nativeEvent === null || nativeEvent === void 0 ? void 0 : nativeEvent.contentSize) === null || _c === void 0 ? void 0 : _c.height) > layout.height)) {
            return;
        }
        scrollValueY.setValue(offsetY);
    };
    const onLongPressHandler = useCallback((event) => {
        onLongPress(imageSrc);
    }, [imageSrc, onLongPress]);
    const dynamicStyles = useMemo(() => ({
        listItem: {
            width: layout.width,
            height: layout.height,
        },
        imageScrollContainer: {
            height: layout.height,
        },
    }), [layout.width, layout.height]);
    return (<View>
      <ScrollView ref={scrollViewRef} style={dynamicStyles.listItem} pinchGestureEnabled showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false} maximumZoomScale={5} contentContainerStyle={dynamicStyles.imageScrollContainer} scrollEnabled={swipeToCloseEnabled} onScrollEndDrag={onScrollEndDrag} scrollEventThrottle={16} // Higher value for better Android performance
     {...(swipeToCloseEnabled && {
        onScroll,
    })} 
    // Android-specific overscroll mode
    overScrollMode="never">
        {/* {(!loaded || !imageDimensions) && <ImageLoading />} */}
        <TouchableWithoutFeedback onPress={doubleTapToZoomEnabled ? handleDoubleTap : undefined} onLongPress={onLongPressHandler} delayLongPress={delayLongPress}>
          <Animated.View style={imageStylesWithOpacity}>
            <ExpoImage source={imageSrc} style={{
            width: "100%",
            height: "100%",
        }} 
    // onLoad={() => setLoaded(true)}
    // Add Android-specific caching strategy
    cachePolicy="memory-disk"/>
          </Animated.View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </View>);
};
export default React.memo(ImageItem);
