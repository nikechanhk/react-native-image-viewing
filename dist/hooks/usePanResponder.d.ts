/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { Animated, GestureResponderHandlers, ScaledSize } from "react-native";
import { Position } from "../@types";
type Props = {
    initialScale: number;
    initialTranslate: Position;
    onZoom: (isZoomed: boolean) => void;
    doubleTapToZoomEnabled: boolean;
    onLongPress: () => void;
    delayLongPress: number;
    currentImageIndex: number;
    layout: ScaledSize;
};
declare const usePanResponder: ({ initialScale, initialTranslate, onZoom, doubleTapToZoomEnabled, onLongPress, delayLongPress, currentImageIndex, layout, }: Props) => Readonly<[GestureResponderHandlers, Animated.Value, Animated.ValueXY]>;
export default usePanResponder;
