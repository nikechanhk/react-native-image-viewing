/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
// @ts-nocheck
import React, { ComponentType, useCallback, useRef, useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  View,
  VirtualizedList,
  ModalProps,
  Modal,
  ScaledSize,
} from "react-native";

import ImageItem from "./components/ImageItem/ImageItem";
import ImageDefaultHeader from "./components/ImageDefaultHeader";
import StatusBarManager from "./components/StatusBarManager";

import useAnimatedComponents from "./hooks/useAnimatedComponents";
import useImageIndexChange from "./hooks/useImageIndexChange";
import useRequestClose from "./hooks/useRequestClose";
import { ImageSource } from "./@types";

type Props = {
  images: ImageSource[];
  keyExtractor?: (imageSrc: ImageSource, index: number) => string;
  imageIndex: number;
  visible: boolean;
  onRequestClose: () => void;
  onLongPress?: (image: ImageSource) => void;
  onImageIndexChange?: (imageIndex: number) => void;
  presentationStyle?: ModalProps["presentationStyle"];
  animationType?: ModalProps["animationType"];
  backgroundColor?: string;
  swipeToCloseEnabled?: boolean;
  doubleTapToZoomEnabled?: boolean;
  delayLongPress?: number;
  HeaderComponent?: ComponentType<{ imageIndex: number }>;
  FooterComponent?: ComponentType<{ imageIndex: number }>;
};

const DEFAULT_ANIMATION_TYPE = "fade";
const DEFAULT_BG_COLOR = "#000";
const DEFAULT_DELAY_LONG_PRESS = 800;

type VirtualizedListRef = {
  scrollToIndex: (params: { index: number; animated: boolean }) => void;
  setNativeProps: (props: { scrollEnabled: boolean }) => void;
};

function ImageViewing({
  images,
  keyExtractor,
  imageIndex,
  visible,
  onRequestClose,
  onLongPress = () => {},
  onImageIndexChange,
  animationType = DEFAULT_ANIMATION_TYPE,
  backgroundColor = DEFAULT_BG_COLOR,
  presentationStyle,
  swipeToCloseEnabled,
  doubleTapToZoomEnabled,
  delayLongPress = DEFAULT_DELAY_LONG_PRESS,
  HeaderComponent,
  FooterComponent,
}: Props) {
  const imageList = useRef<VirtualizedList<ImageSource> & VirtualizedListRef>(null);
  const [opacity, onRequestCloseEnhanced] = useRequestClose(onRequestClose);
  const [dimensions, setDimensions] = useState<ScaledSize>(Dimensions.get("window"));
  const [layout, setLayout] = useState<Dimensions>({ width: 0, height: 0 });
  // Directly manage the image index without relying on the hook
  const [currentImageIndex, setCurrentImageIndex] = useState(imageIndex);
  const lastOffsetX = useRef(0);
  const isScrolling = useRef(false);
  const previousLayout = useRef<ScaledSize>(dimensions);
  const [orientationChanged, setOrientationChanged] = useState(false);
  const [currentScrollIndex, setCurrentScrollIndex] = useState(imageIndex);
  const orientationChangeInProgress = useRef(false);
  const [headerTransform, footerTransform, toggleBarsVisible] =
    useAnimatedComponents();
    
  useEffect(() => {
    const onChange = ({ window }: { window: ScaledSize }) => {
      // Update dimensions when orientation changes
      setDimensions(window);
      
      // Force layout update to trigger orientation detection in hooks
      setLayout(prev => ({
        width: window.width,
        height: window.height
      }));
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
        imageList.current?.scrollToIndex({
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

  const onZoom = useCallback(
    (isScaled: boolean) => {
      imageList.current?.setNativeProps({ scrollEnabled: !isScaled });
      toggleBarsVisible(!isScaled);
    },
    [imageList]
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: layout.width,
      offset: layout.width * index,
      index,
    }),
    [layout.width, orientationChanged]
  );



  // Direct scroll handler that calculates index without using the hook
  const onScrollHandler = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (orientationChangeInProgress.current) {
      return;
    }

    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    lastOffsetX.current = contentOffset.x;
    isScrolling.current = true;

    if (layoutMeasurement.width > 0) {
      const index = Math.round(contentOffset.x / layoutMeasurement.width);
      if (index >= 0 && index !== currentImageIndex) {
        setCurrentImageIndex(index);
      }
    }
  }, [currentImageIndex]);

  // Handle scroll end to ensure final position is captured
  const onMomentumScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (orientationChangeInProgress.current) {
      return;
    }

    isScrolling.current = false;
    const { layoutMeasurement } = event.nativeEvent;
    
    if (layoutMeasurement.width > 0) {
      const finalIndex = Math.round(lastOffsetX.current / layoutMeasurement.width);
      if (finalIndex >= 0 && finalIndex !== currentImageIndex) {
        setCurrentImageIndex(finalIndex);
      }
    }
  }, [currentImageIndex]);

  if (!visible) {
    return null;
  }

  return (
    <Modal
      transparent={presentationStyle === "overFullScreen"}
      visible={visible}
      presentationStyle={presentationStyle}
      animationType={animationType}
      onRequestClose={onRequestCloseEnhanced}
      supportedOrientations={["portrait", "landscape"]}
      hardwareAccelerated
    >
      <StatusBarManager presentationStyle={presentationStyle} />
      <View 
        style={[styles.container, { opacity, backgroundColor }]}
        onLayout={(e) => {
          const newLayout = e.nativeEvent.layout;
          if (newLayout.width !== layout.width || 
              newLayout.height !== layout.height) {
            setLayout(newLayout);
          }
        }}
      >
        <Animated.View style={[styles.header, { transform: headerTransform }]}>
          {typeof HeaderComponent !== "undefined" ? (
            React.createElement(HeaderComponent, {
              imageIndex: currentImageIndex,
            })
          ) : (
            <ImageDefaultHeader onRequestClose={onRequestCloseEnhanced} />
          )}
        </Animated.View>
        <VirtualizedList
        key={orientationChanged ? 'orientation-changed' : 'normal'}
          ref={imageList}
          data={images}
          horizontal
          pagingEnabled
          windowSize={2}
          initialNumToRender={1}
          maxToRenderPerBatch={1}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          initialScrollIndex={currentScrollIndex}
          getItem={(_, index) => images[index]}
          getItemCount={() => images.length}
          getItemLayout={getItemLayout}
          renderItem={({ item: imageSrc }) => (
            <ImageItem
              onZoom={onZoom}
              imageSrc={imageSrc}
              onRequestClose={onRequestCloseEnhanced}
              onLongPress={onLongPress}
              delayLongPress={delayLongPress}
              swipeToCloseEnabled={swipeToCloseEnabled}
              doubleTapToZoomEnabled={doubleTapToZoomEnabled}
              currentImageIndex={currentImageIndex}
              layout={dimensions}
            />
          )}
          onMomentumScrollEnd={onMomentumScrollEnd}
          onScroll={onScrollHandler}
          scrollEventThrottle={8}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
          }}
          //@ts-ignore
          keyExtractor={(imageSrc, index) =>
            keyExtractor
              ? keyExtractor(imageSrc, index)
              : typeof imageSrc === "number"
              ? `${imageSrc}`
              : imageSrc.uri
          }
          onScrollToIndexFailed={(info) => {
            console.warn('Scroll to index failed:', info);
          }}
        />
        {typeof FooterComponent !== "undefined" && (
          <Animated.View
            style={[styles.footer, { transform: footerTransform }]}
          >
            {React.createElement(FooterComponent, {
              imageIndex: currentImageIndex,
            })}
          </Animated.View>
        )}
      </View>
    </Modal>
  );
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

const EnhancedImageViewing = (props: Props) => (
  <ImageViewing key={props.imageIndex} {...props} />
);

export default EnhancedImageViewing;
