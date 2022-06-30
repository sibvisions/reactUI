import React, { FC } from "react";

export interface IExtendableMap {
    onClick?(e: { originalEvent: MouseEvent, lat: number, lng: number }): void,
    onDrag?(centerLat: number, centerLng: number): void,
    onDragEnd?(centerLat: number, centerLng: number): void,
    onSelectedMarkerChanged?(lat: number|undefined, lng: number|undefined): void
}

export interface IExtendableMapGoogle extends IExtendableMap {
    onZoomChanged?(centerLat: number, centerLng: number): void,
}

const ExtendMapGoogle: FC<IExtendableMapGoogle> = () => {
    return (
        <>
        </>
    )
}
export default ExtendMapGoogle