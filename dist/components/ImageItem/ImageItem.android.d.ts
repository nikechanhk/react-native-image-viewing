/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import React from "react";
import { ScaledSize } from "react-native";
import { ImageSource } from "../../@types";
type Props = {
    imageSrc: ImageSource;
    onRequestClose: () => void;
    onZoom: (isZoomed: boolean) => void;
    onLongPress: (image: ImageSource) => void;
    delayLongPress: number;
    swipeToCloseEnabled?: boolean;
    doubleTapToZoomEnabled?: boolean;
    currentImageIndex: number;
    layout: ScaledSize;
};
declare const _default: React.MemoExoticComponent<({ imageSrc, onZoom, onRequestClose, onLongPress, delayLongPress, swipeToCloseEnabled, doubleTapToZoomEnabled, currentImageIndex, layout, }: Props) => JSX.Element>;
export default _default;
