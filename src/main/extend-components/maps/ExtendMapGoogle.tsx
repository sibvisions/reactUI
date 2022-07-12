/* Copyright 2022 SIB Visions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import React, { FC } from "react";

// Interface for extendable-map
export interface IExtendableMap {
    onClick?(e: { originalEvent: MouseEvent, lat: number, lng: number }): void,
    onDrag?(centerLat: number, centerLng: number): void,
    onDragEnd?(centerLat: number, centerLng: number): void,
    onSelectedMarkerChanged?(lat: number|undefined, lng: number|undefined): void
}

// Interface for extendable-map-google
export interface IExtendableMapGoogle extends IExtendableMap {
    onZoomChanged?(centerLat: number, centerLng: number): void,
}

// This component is an empty substitute for the component UIMapGoogle
const ExtendMapGoogle: FC<IExtendableMapGoogle> = () => {
    return (
        <>
        </>
    )
}
export default ExtendMapGoogle