/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import React, { useCallback, useRef, useState, useEffect } from "react";
import { View, Animated, ScrollView, Dimensions, StyleSheet, } from "react-native";
import usePanResponder from "../../hooks/usePanResponder";
import { getImageStyles, getImageTransform } from "../../utils";
import { ImageLoading } from "./ImageLoading";
import { Image as ExpoImage } from "expo-image";
const SWIPE_CLOSE_OFFSET = 75;
const SWIPE_CLOSE_VELOCITY = 1.75;
const SCREEN = Dimensions.get("window");
const SCREEN_WIDTH = SCREEN.width;
const SCREEN_HEIGHT = SCREEN.height;
const ImageItem = ({ imageSrc, onZoom, onRequestClose, onLongPress, delayLongPress, swipeToCloseEnabled = true, doubleTapToZoomEnabled = true, currentImageIndex, }) => {
    const imageContainer = useRef(null);
    const imageDimensions = {
        width: 358,
        height: 239,
    };
    const [translate, scale] = getImageTransform(imageDimensions, SCREEN);
    const scrollValueY = new Animated.Value(0);
    const [isLoaded, setLoadEnd] = useState(false);
    const onLoaded = useCallback(() => setLoadEnd(true), []);
    const onZoomPerformed = useCallback((isZoomed) => {
        onZoom(isZoomed);
        if (imageContainer === null || imageContainer === void 0 ? void 0 : imageContainer.current) {
            imageContainer.current.setNativeProps({
                scrollEnabled: !isZoomed,
            });
        }
    }, [imageContainer]);
    useEffect(() => {
        if (imageContainer.current) {
            imageContainer.current.scrollTo({ y: SCREEN_HEIGHT, animated: false });
        }
    }, [imageContainer]);
    const onLongPressHandler = useCallback(() => {
        onLongPress(imageSrc);
    }, [imageSrc, onLongPress]);
    const [panHandlers, scaleValue, translateValue] = usePanResponder({
        initialScale: scale || 1,
        initialTranslate: translate || { x: 0, y: 0 },
        onZoom: onZoomPerformed,
        doubleTapToZoomEnabled,
        onLongPress: onLongPressHandler,
        delayLongPress,
        currentImageIndex,
    });
    const imagesStyles = getImageStyles(imageDimensions, translateValue, scaleValue);
    const imageOpacity = scrollValueY.interpolate({
        inputRange: [-SWIPE_CLOSE_OFFSET, 0, SWIPE_CLOSE_OFFSET],
        outputRange: [0.7, 1, 0.7],
    });
    const imageStylesWithOpacity = { ...imagesStyles, opacity: 1 };
    const onScrollEndDrag = ({ nativeEvent, }) => {
        var _a, _b, _c, _d;
        const velocityY = (_b = (_a = nativeEvent === null || nativeEvent === void 0 ? void 0 : nativeEvent.velocity) === null || _a === void 0 ? void 0 : _a.y) !== null && _b !== void 0 ? _b : 0;
        const offsetY = (_d = (_c = nativeEvent === null || nativeEvent === void 0 ? void 0 : nativeEvent.contentOffset) === null || _c === void 0 ? void 0 : _c.y) !== null && _d !== void 0 ? _d : 0;
        if ((Math.abs(velocityY) > SWIPE_CLOSE_VELOCITY &&
            (offsetY > SWIPE_CLOSE_OFFSET + SCREEN_HEIGHT || offsetY < -SWIPE_CLOSE_OFFSET + SCREEN_HEIGHT))) {
            onRequestClose();
        }
    };
    const onScroll = ({ nativeEvent, }) => {
        var _a, _b;
        const offsetY = (_b = (_a = nativeEvent === null || nativeEvent === void 0 ? void 0 : nativeEvent.contentOffset) === null || _a === void 0 ? void 0 : _a.y) !== null && _b !== void 0 ? _b : 0;
        scrollValueY.setValue(offsetY);
        if (offsetY > SCREEN_HEIGHT + SCREEN_HEIGHT / 2 ||
            offsetY < SCREEN_HEIGHT - SCREEN_HEIGHT / 2) {
            onRequestClose();
        }
    };
    return (<ScrollView ref={imageContainer} style={styles.listItem} pagingEnabled nestedScrollEnabled showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false} contentContainerStyle={styles.imageScrollContainer} scrollEnabled={swipeToCloseEnabled} {...(swipeToCloseEnabled && {
        onScroll,
        onScrollEndDrag,
    })}>
      <View style={{ height: SCREEN_HEIGHT }}/>
      <Animated.View {...panHandlers} style={imageStylesWithOpacity}>
        <ExpoImage source={imageSrc} style={{
            width: "100%",
            height: "100%",
        }} onLoad={onLoaded}/>
      </Animated.View>
      {(!isLoaded || !imageDimensions) && <ImageLoading />}
    </ScrollView>);
};
const styles = StyleSheet.create({
    listItem: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    },
    imageScrollContainer: {
        height: SCREEN_HEIGHT * 3,
    },
});
export default React.memo(ImageItem);
