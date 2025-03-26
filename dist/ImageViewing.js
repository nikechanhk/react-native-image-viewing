/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
// @ts-nocheck
import React, { useCallback, useRef, useEffect, useState } from "react";
import { Animated, Dimensions, StyleSheet, View, VirtualizedList, Modal, } from "react-native";
import ImageItem from "./components/ImageItem/ImageItem";
import ImageDefaultHeader from "./components/ImageDefaultHeader";
import StatusBarManager from "./components/StatusBarManager";
import useAnimatedComponents from "./hooks/useAnimatedComponents";
import useImageIndexChange from "./hooks/useImageIndexChange";
import useRequestClose from "./hooks/useRequestClose";
const DEFAULT_ANIMATION_TYPE = "fade";
const DEFAULT_BG_COLOR = "#000";
const DEFAULT_DELAY_LONG_PRESS = 800;
function ImageViewing({ images, keyExtractor, imageIndex, visible, onRequestClose, onLongPress = () => { }, onImageIndexChange, animationType = DEFAULT_ANIMATION_TYPE, backgroundColor = DEFAULT_BG_COLOR, presentationStyle, swipeToCloseEnabled, doubleTapToZoomEnabled, delayLongPress = DEFAULT_DELAY_LONG_PRESS, HeaderComponent, FooterComponent, }) {
    const imageList = useRef(null);
    const [opacity, onRequestCloseEnhanced] = useRequestClose(onRequestClose);
    const [dimensions, setDimensions] = useState(Dimensions.get("window"));
    const [layout, setLayout] = useState({ width: 0, height: 0 });
    const [currentImageIndex, setCurrentImageIndex] = useState(imageIndex);
    const [_, onScroll] = useImageIndexChange(imageIndex, layout, (newIndex) => {
        setCurrentImageIndex(newIndex);
    });
    const previousLayout = useRef(dimensions);
    const [orientationChanged, setOrientationChanged] = useState(false);
    const [currentScrollIndex, setCurrentScrollIndex] = useState(imageIndex);
    const orientationChangeInProgress = useRef(false);
    const [headerTransform, footerTransform, toggleBarsVisible] = useAnimatedComponents();
    useEffect(() => {
        const onChange = ({ window }) => {
            setDimensions(window);
        };
        const subscription = Dimensions.addEventListener("change", onChange);
        return () => subscription.remove();
    }, []);
    useEffect(() => {
        if (onImageIndexChange) {
            onImageIndexChange(currentImageIndex);
        }
    }, [currentImageIndex]);
    useEffect(() => {
        if (layout.width !== previousLayout.current.width && layout.width !== 0) {
            orientationChangeInProgress.current = true;
            setOrientationChanged(true);
            const targetIndex = currentImageIndex;
            const timer = setTimeout(() => {
                var _a;
                (_a = imageList.current) === null || _a === void 0 ? void 0 : _a.scrollToIndex({
                    index: targetIndex,
                    animated: false,
                });
                setCurrentScrollIndex(targetIndex);
                setTimeout(() => {
                    orientationChangeInProgress.current = false;
                }, 100);
                setOrientationChanged(false);
                previousLayout.current = layout;
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [layout.width]);
    const onZoom = useCallback((isScaled) => {
        var _a;
        (_a = imageList.current) === null || _a === void 0 ? void 0 : _a.setNativeProps({ scrollEnabled: !isScaled });
        toggleBarsVisible(!isScaled);
    }, [imageList]);
    const getItemLayout = useCallback((_, index) => ({
        length: layout.width,
        offset: layout.width * index,
        index,
    }), [layout.width, orientationChanged]);
    const onMomentumScrollEnd = useCallback((event) => {
        if (orientationChangeInProgress.current) {
            return;
        }
        onScroll(event);
    }, [onScroll, currentImageIndex]);
    const onScrollHandler = useCallback((event) => {
        if (!orientationChangeInProgress.current) {
            // Always call onScroll to ensure index updates
            onScroll(event);
        }
    }, [onScroll]);
    if (!visible) {
        return null;
    }
    return (<Modal transparent={presentationStyle === "overFullScreen"} visible={visible} presentationStyle={presentationStyle} animationType={animationType} onRequestClose={onRequestCloseEnhanced} supportedOrientations={["portrait", "landscape"]} hardwareAccelerated>
      <StatusBarManager presentationStyle={presentationStyle}/>
      <View style={[styles.container, { opacity, backgroundColor }]} onLayout={(e) => {
            const newLayout = e.nativeEvent.layout;
            if (newLayout.width !== layout.width ||
                newLayout.height !== layout.height) {
                setLayout(newLayout);
            }
        }}>
        <Animated.View style={[styles.header, { transform: headerTransform }]}>
          {typeof HeaderComponent !== "undefined" ? (React.createElement(HeaderComponent, {
            imageIndex: currentImageIndex,
        })) : (<ImageDefaultHeader onRequestClose={onRequestCloseEnhanced}/>)}
        </Animated.View>
        <VirtualizedList key={orientationChanged ? 'orientation-changed' : 'normal'} ref={imageList} data={images} horizontal pagingEnabled windowSize={2} initialNumToRender={1} maxToRenderPerBatch={1} showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false} initialScrollIndex={currentScrollIndex} getItem={(_, index) => images[index]} getItemCount={() => images.length} getItemLayout={getItemLayout} renderItem={({ item: imageSrc }) => (<ImageItem onZoom={onZoom} imageSrc={imageSrc} onRequestClose={onRequestCloseEnhanced} onLongPress={onLongPress} delayLongPress={delayLongPress} swipeToCloseEnabled={swipeToCloseEnabled} doubleTapToZoomEnabled={doubleTapToZoomEnabled} currentImageIndex={currentImageIndex} layout={dimensions}/>)} onMomentumScrollEnd={onMomentumScrollEnd} onScroll={onScrollHandler} scrollEventThrottle={8} // Use a more frequent update for smoother tracking
     maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
        }} 
    //@ts-ignore
    keyExtractor={(imageSrc, index) => keyExtractor
            ? keyExtractor(imageSrc, index)
            : typeof imageSrc === "number"
                ? `${imageSrc}`
                : imageSrc.uri} onScrollToIndexFailed={(info) => {
            console.warn('Scroll to index failed:', info);
        }}/>
        {typeof FooterComponent !== "undefined" && (<Animated.View style={[styles.footer, { transform: footerTransform }]}>
            {React.createElement(FooterComponent, {
                imageIndex: currentImageIndex,
            })}
          </Animated.View>)}
      </View>
    </Modal>);
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    header: {
        position: "absolute",
        width: "100%",
        zIndex: 1,
        top: 0,
    },
    footer: {
        position: "absolute",
        width: "100%",
        zIndex: 1,
        bottom: 0,
    },
});
const EnhancedImageViewing = (props) => (<ImageViewing key={props.imageIndex} {...props}/>);
export default EnhancedImageViewing;
