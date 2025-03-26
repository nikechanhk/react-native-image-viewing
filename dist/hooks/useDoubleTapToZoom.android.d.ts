/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { ScrollView, NativeTouchEvent, NativeSyntheticEvent, ScaledSize } from "react-native";
/**
 * Android-specific implementation of double tap to zoom
 * Uses a different approach than iOS since scrollResponderZoomTo is not available on Android
 */
declare function useDoubleTapToZoom(scrollViewRef: React.RefObject<ScrollView>, scaled: boolean, screen: ScaledSize): (event: NativeSyntheticEvent<NativeTouchEvent>) => void;
export default useDoubleTapToZoom;
