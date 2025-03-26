/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import React, { useCallback, useRef, useState, useEffect } from "react";
import { ScrollView, StyleSheet, View, TouchableWithoutFeedback, } from "react-native";
import useDoubleTapToZoom from "../../hooks/useDoubleTapToZoom";
import useImageDimensions from "../../hooks/useImageDimensions";
import { ImageLoading } from "./ImageLoading";
import { Image as ExpoImage } from "expo-image";
const SWIPE_CLOSE_OFFSET = 75;
const SWIPE_CLOSE_VELOCITY = 1.55;
// A very simple component that prioritizes vertical centering
const ImageItem = ({ imageSrc, onZoom, onRequestClose, onLongPress, delayLongPress, swipeToCloseEnabled = true, doubleTapToZoomEnabled = true, currentImageIndex, layout, }) => {
    const scrollViewRef = useRef(null);
    const [loaded, setLoaded] = useState(false);
    const [scaled, setScaled] = useState(false);
    const imageDimensions = useImageDimensions(imageSrc) || { width: 0, height: 0 };
    const handleDoubleTap = useDoubleTapToZoom(scrollViewRef, scaled, layout);
    // Reset scroll view when layout changes (orientation change)
    useEffect(() => {
        if (scrollViewRef.current && !scaled) {
            scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: false });
        }
    }, [layout.width, layout.height, scaled]);
    // Determine proper size to maintain aspect ratio and fit screen width
    const aspectRatio = imageDimensions.width && imageDimensions.height ?
        imageDimensions.width / imageDimensions.height :
        1;
    // Calculate height based on aspect ratio
    const imageHeight = aspectRatio ? layout.width / aspectRatio : layout.height;
    const maxScale = 3; // Simple fixed max zoom
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
        // Simple scroll handler for vertical swipes
        if ((nativeEvent === null || nativeEvent === void 0 ? void 0 : nativeEvent.zoomScale) > 1) {
            return;
        }
    };
    const onLongPressHandler = useCallback((event) => {
        onLongPress(imageSrc);
    }, [imageSrc, onLongPress]);
    return (<View style={styles.container}>
      {(!loaded || !imageDimensions) && <ImageLoading />}
      
      <View style={styles.imageWrapper}>
        <ScrollView ref={scrollViewRef} contentContainerStyle={{
            minHeight: layout.height,
            minWidth: layout.width,
            justifyContent: 'center',
            alignItems: 'center',
        }} style={styles.scrollView} pinchGestureEnabled maximumZoomScale={maxScale} showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false} scrollEnabled={swipeToCloseEnabled} onScrollEndDrag={onScrollEndDrag} {...(swipeToCloseEnabled && { onScroll })}>
          <TouchableWithoutFeedback onPress={doubleTapToZoomEnabled ? handleDoubleTap : undefined} onLongPress={onLongPressHandler} delayLongPress={delayLongPress}>
            <View style={styles.touchableContainer}>
              <ExpoImage source={imageSrc} style={{
            width: layout.width,
            height: imageHeight,
            alignSelf: 'center'
        }} contentFit="contain" contentPosition="center" onLoad={() => setLoaded(true)}/>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </View>
    </View>);
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    imageWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
        alignSelf: 'stretch',
    },
    touchableContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
    }
});
export default React.memo(ImageItem);
