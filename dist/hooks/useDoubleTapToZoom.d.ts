/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import React from "react";
import { ScrollView, NativeTouchEvent, NativeSyntheticEvent, ScaledSize } from "react-native";
/**
 * This is iOS only.
 * Same functionality for Android implemented inside usePanResponder hook.
 */
declare function useDoubleTapToZoom(scrollViewRef: React.RefObject<ScrollView>, scaled: boolean, screen: ScaledSize): (event: NativeSyntheticEvent<NativeTouchEvent>) => void;
export default useDoubleTapToZoom;
