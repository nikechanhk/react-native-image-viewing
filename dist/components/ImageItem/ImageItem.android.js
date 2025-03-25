/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import React, { useCallback, useRef, useState, useEffect, useMemo } from "react";
import { View, Animated, ScrollView, } from "react-native";
import usePanResponder from "../../hooks/usePanResponder";
import useImageDimensions from "../../hooks/useImageDimensions";
import { getImageStyles, getImageTransform } from "../../utils";
import { ImageLoading } from "./ImageLoading";
import { Image as ExpoImage } from "expo-image";
const SWIPE_CLOSE_OFFSET = 75;
const SWIPE_CLOSE_VELOCITY = 1.75;
const ImageItem = ({ imageSrc, onZoom, onRequestClose, onLongPress, delayLongPress, swipeToCloseEnabled = true, doubleTapToZoomEnabled = true, currentImageIndex, layout, }) => {
    const imageContainer = useRef(null);
    const imageDimensions = useImageDimensions(imageSrc) || { width: 0, height: 0 };
    const [translate, scale] = getImageTransform(imageDimensions, { width: layout.width, height: layout.height });
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
            imageContainer.current.scrollTo({ y: layout.height, animated: false });
        }
    }, [imageContainer, layout.height]);
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
        layout,
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
            (offsetY > SWIPE_CLOSE_OFFSET + layout.height || offsetY < -SWIPE_CLOSE_OFFSET + layout.height))) {
            onRequestClose();
        }
    };
    const onScroll = ({ nativeEvent, }) => {
        var _a, _b;
        const offsetY = (_b = (_a = nativeEvent === null || nativeEvent === void 0 ? void 0 : nativeEvent.contentOffset) === null || _a === void 0 ? void 0 : _a.y) !== null && _b !== void 0 ? _b : 0;
        scrollValueY.setValue(offsetY);
        if (offsetY > layout.height + layout.height / 2 ||
            offsetY < layout.height - layout.height / 2) {
            onRequestClose();
        }
    };
    // Reset scroll position when layout changes
    useEffect(() => {
        if (imageContainer.current) {
            imageContainer.current.scrollTo({ x: 0, y: 0, animated: false });
        }
    }, [layout.width, layout.height]);
    const dynamicStyles = useMemo(() => ({
        listItem: {
            width: layout.width,
            height: layout.height,
        },
        imageScrollContainer: {
            height: layout.height * 2,
        },
    }), [layout.width, layout.height]);
    return (<ScrollView ref={imageContainer} style={dynamicStyles.listItem} pagingEnabled nestedScrollEnabled showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false} contentContainerStyle={dynamicStyles.imageScrollContainer} scrollEnabled={swipeToCloseEnabled} {...(swipeToCloseEnabled && {
        onScroll,
        onScrollEndDrag,
    })}>
      <View style={{ height: layout.height }}/>
      <Animated.View {...panHandlers} style={imageStylesWithOpacity}>
        <View style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            zIndex: -1,
        }}>
            {(isLoaded || imageDimensions) && <ImageLoading />}
        </View>
        <ExpoImage source={imageSrc} style={{
            width: "100%",
            height: "100%",
        }} onLoad={onLoaded}/>
      </Animated.View>
    </ScrollView>);
};
export default React.memo(ImageItem);
