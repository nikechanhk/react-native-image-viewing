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
    // Force iPad to use full screen width for each image
    const effectiveDimensions = {
        width: dimensions.width,
        height: dimensions.height,
        scale: dimensions.scale,
        fontScale: dimensions.fontScale
    };
    const [currentImageIndex, onScroll] = useImageIndexChange(imageIndex, effectiveDimensions);
    const [headerTransform, footerTransform, toggleBarsVisible] = useAnimatedComponents();
    useEffect(() => {
        const onChange = ({ window }) => {
            setDimensions(window);
            // Reset VirtualizedList when orientation changes
            if (imageList.current) {
                // Force layout update after orientation change
                setTimeout(() => {
                    if (imageList.current && typeof currentImageIndex === 'number') {
                        imageList.current.scrollToIndex({
                            index: currentImageIndex,
                            animated: false,
                            viewPosition: 0.5,
                        });
                    }
                }, 100); // Small delay to ensure dimensions are updated
            }
        };
        const subscription = Dimensions.addEventListener("change", onChange);
        return () => subscription.remove();
    }, [currentImageIndex]);
    useEffect(() => {
        if (onImageIndexChange) {
            onImageIndexChange(currentImageIndex);
        }
    }, [currentImageIndex]);
    const onZoom = useCallback((isScaled) => {
        var _a;
        // @ts-ignore
        (_a = imageList === null || imageList === void 0 ? void 0 : imageList.current) === null || _a === void 0 ? void 0 : _a.setNativeProps({ scrollEnabled: !isScaled });
        toggleBarsVisible(!isScaled);
    }, [imageList]);
    if (!visible) {
        return null;
    }
    return (<Modal transparent={presentationStyle === "overFullScreen"} visible={visible} presentationStyle={presentationStyle} animationType={animationType} onRequestClose={onRequestCloseEnhanced} supportedOrientations={["portrait", "landscape"]} hardwareAccelerated>
      <StatusBarManager presentationStyle={presentationStyle}/>
      <View style={[styles.container, { opacity, backgroundColor }]}>
        <Animated.View style={[styles.header, { transform: headerTransform }]}>
          {typeof HeaderComponent !== "undefined" ? (React.createElement(HeaderComponent, {
            imageIndex: currentImageIndex,
        })) : (<ImageDefaultHeader onRequestClose={onRequestCloseEnhanced}/>)}
        </Animated.View>
        <VirtualizedList ref={imageList} data={images} horizontal pagingEnabled windowSize={2} initialNumToRender={2} /* Render more items initially to avoid empty pages */ maxToRenderPerBatch={2} /* Increase batch size for smoother experience */ showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false} initialScrollIndex={imageIndex} decelerationRate="fast" /* Improve snapping behavior */ getItem={(_, index) => images[index]} getItemCount={() => images.length} getItemLayout={(_, index) => {
            // Ensure each item takes exactly the full screen width
            // regardless of device (iPhone, iPad, etc.)
            return {
                length: dimensions.width,
                offset: dimensions.width * index,
                index,
            };
        }} renderItem={({ item: imageSrc }) => (<View style={{
                width: dimensions.width,
                height: dimensions.height,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'black',
                flex: 1,
            }}>
              <View style={{
                width: dimensions.width,
                height: dimensions.height,
                alignItems: 'center',
                justifyContent: 'center',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
            }}>
                <ImageItem onZoom={onZoom} imageSrc={imageSrc} onRequestClose={onRequestCloseEnhanced} onLongPress={onLongPress} delayLongPress={delayLongPress} swipeToCloseEnabled={swipeToCloseEnabled} doubleTapToZoomEnabled={doubleTapToZoomEnabled} currentImageIndex={currentImageIndex} layout={effectiveDimensions}/>
              </View>
            </View>)} onMomentumScrollEnd={onScroll} onLayout={() => {
            // Ensure correct scroll position after layout changes
            if (imageList.current && typeof currentImageIndex === 'number' && currentImageIndex > 0) {
                imageList.current.scrollToIndex({
                    index: currentImageIndex,
                    animated: false,
                    viewPosition: 0.5,
                });
            }
        }} 
    //@ts-ignore
    keyExtractor={(imageSrc, index) => keyExtractor
            ? keyExtractor(imageSrc, index)
            : typeof imageSrc === "number"
                ? `${imageSrc}`
                : imageSrc.uri}/>
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
