/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { Dimensions } from "../@types";
type IndexChangeCallback = (index: number) => void;
declare const useImageIndexChange: (initialIndex: number, layout: Dimensions, onIndexChange?: IndexChangeCallback) => readonly [number, (event: NativeSyntheticEvent<NativeScrollEvent>) => void];
export default useImageIndexChange;
