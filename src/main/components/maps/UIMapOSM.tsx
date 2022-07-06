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

import React, { CSSProperties, FC, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Polygon, TileLayer, useMap, useMapEvent } from "react-leaflet";
import 'leaflet/dist/leaflet.css';
import L, { PolylineOptions } from "leaflet";
import tinycolor from 'tinycolor2';
import { appContext } from "../../contexts/AppProvider";
import BaseComponent from "../../util/types/BaseComponent";
import { showTopBar, TopBarContext } from "../topbar/TopBar";
import MapLocation from "../../util/types/MapLocation";
import useLayoutValue from "../../hooks/style-hooks/useLayoutValue";
import useProperties from "../../hooks/data-hooks/useProperties";
import { parseMapLocation, parseMaxSize, parseMinSize, parsePrefSize } from "../../util/component-util/SizeUtil";
import useMouseListener from "../../hooks/event-hooks/useMouseListener";
import usePopupMenu from "../../hooks/data-hooks/usePopupMenu";
import { sendOnLoadCallback } from "../../util/server-util/SendOnLoadCallback";
import { getTabIndex } from "../../util/component-util/GetTabIndex";

import useDataProviderData from "../../hooks/data-hooks/useDataProviderData";
import { sortGroupDataOSM } from "../../util/component-util/SortGroupData";
import { sendMapFetchRequests } from "../../util/server-util/SendMapFetchRequests";
import { sendSetValues } from "../../util/server-util/SendSetValues";
import { sendSaveRequest } from "../../util/server-util/SendSaveRequest";
import IconProps from "../comp-props/IconProps";
import { getMarkerIcon } from "../../util/component-util/GetMarkerIcon";
import { IExtendableMap } from "../../extend-components/maps/ExtendMapGoogle";

/** Interface for Map components */
export interface IMap extends BaseComponent {
    apiKey?: string
    center?: string
    fillColor?: string
    groupDataBook: string
    groupColumnName?: string
    latitudeColumnName?: string
    lineColor?: string
    longitudeColumnName?: string
    marker?: string
    markerImageColumnName?: string
    pointsDataBook: string
    pointSelectionEnabled?: boolean
    pointSelectionLockedOnCenter?: boolean
    tileProvider?: string
    zoomLevel?: number
    layoutVal?:CSSProperties,
    centerPosition?:MapLocation
}

/**
 * This component displays a map view with OpenStreetMap using leaflet. 
 * This part of the map will cover positioning and size reporting and wraps the actual map
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIMapOSM: FC<IMap & IExtendableMap> = (baseProps) => {
    /** Reference for the map element */
    const mapRef = useRef<any>(null);

    /** The positioning and size of the component */
    const layoutStyle = useLayoutValue(baseProps.id);

    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<IMap & IExtendableMap>(baseProps.id, baseProps);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = props;

    /** The center position of the map */
    const centerPosition = useMemo(() => parseMapLocation(props.center), [props.center]);

    /** Start zoom value is switched in Google and OSM */
    const startZoom = useMemo(() => props.zoomLevel ? props.zoomLevel : 9, [props.zoomLevel]);

    /** Hook for MouseListener */
    useMouseListener(props.name, mapRef.current ? mapRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** The popup-menu of the map */
    const popupMenu = usePopupMenu(props);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if (onLoadCallback && mapRef.current) {
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), mapRef.current, onLoadCallback);
        }
            
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    /** 
     * Map can't measure itself, because it needs a set height initially --> before the componentsizes are set by the layout,
     * set a default preferredSize (100x100) the layout can use to calculate. 
     */
    if (layoutStyle) {
        return (
            <div ref={mapRef} {...popupMenu} style={layoutStyle} tabIndex={getTabIndex(props.focusable, props.tabIndex)} >
                <MapContainer id={props.name} center={centerPosition ? [centerPosition.latitude, centerPosition.longitude] : [0, 0]} zoom={startZoom} style={{height: "100%", width: "100%"}}>
                    <UIMapOSMConsumer {...props} zoomLevel={startZoom} layoutVal={layoutStyle} centerPosition={centerPosition}/>
                </MapContainer>
            </div>
        )
    }
    else {
        return <div ref={mapRef} style={{width: '100px', height: '100px'}}/>
    }
    

}
export default UIMapOSM

/**
 * This component displays a map view with OpenStreetMap using leaflet.
 * This part of the map, displays the map, adds data, sends requests to the server etc.
 * @param props - props received by container map component
 */
const UIMapOSMConsumer: FC<IMap & IExtendableMap> = (props) => {
    /** Leaflet hook to get map instance */
    const map = useMap();

    /** Reference for markers */
    const markerRefs = useRef<any>([]);

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);

    /** ComponentId of the screen */
    const screenName = context.contentStore.getScreenName(props.id, props.pointsDataBook || props.groupDataBook) as string;

    /** The provided data for groups */
    const [providedGroupData] = useDataProviderData(screenName, props.groupDataBook);

    /** The provided data for points/markers */
    const [providedPointData] = useDataProviderData(screenName, props.pointsDataBook);

    /** The marker used for the point Selection.*/
    const [selectedMarker, setSelectedMarker] = useState<any>();

    /** Colors for polygon filling and polygon lines */
    const options:PolylineOptions = {
        color: props.lineColor ? props.lineColor : tinycolor("rgba (200, 0, 0, 210)").toHexString(),
        fillColor: props.fillColor ? props.fillColor : tinycolor("rgba (202, 39, 41, 41)").toHexString(),
        fillOpacity: 1.0
    }

    // Inits the size of the map (no gray borders)
    useEffect(() => {
        map.invalidateSize();
    }, [props.layoutVal?.width, props.layoutVal?.height]);

    /**
     * Returns an array with the server sent groups sorted
     * @returns array with the server sent groups sorted
     */
    const groupsSorted = useMemo(() => {
        return sortGroupDataOSM(providedGroupData, props.groupColumnName, props.latitudeColumnName, props.longitudeColumnName);
    },[providedGroupData, props.groupColumnName, props.latitudeColumnName, props.longitudeColumnName]);

    /** Fetch Mapdata from server and set new default icon because leaflets default doesn't show */
    useEffect(() => {
        //@ts-ignore
        delete L.Icon.Default.prototype._getIconUrl;

        L.Icon.Default.mergeOptions({
            iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
            iconUrl: require("leaflet/dist/images/marker-icon.png"),
            shadowUrl: require("leaflet/dist/images/marker-shadow.png")
          });

        showTopBar(sendMapFetchRequests(props.groupDataBook, props.pointsDataBook, context.server), topbar);
    },[context.server, props.groupDataBook, props.pointsDataBook]);

    // When the center changes set map view
    useEffect(() => {
        if (props.centerPosition) {
            map.setView([props.centerPosition.latitude, props.centerPosition.longitude])
        }
    }, [props.centerPosition]);

    /** Set the last marker as selectedMarker */
    useEffect(() => {
        if (markerRefs.current) {
            setSelectedMarker(markerRefs.current.slice(-1).pop())
        }
    }, [providedPointData]);

    /** If there is no center set, set center to selectedMarker Position, if locked on center selectedMarker position is always center */
    useEffect(() => {
        if (selectedMarker) {
            if (!props.center) {
                map.setView(selectedMarker.getLatLng(), props.zoomLevel ? props.zoomLevel : 11);
            }
            if (props.pointSelectionLockedOnCenter) {
                selectedMarker.setLatLng(map.getCenter())
            }
        }
    }, [selectedMarker, map, props.center, props.zoomLevel, props.pointSelectionLockedOnCenter]);

    /** When the map is dragged and there is a selectedMarker and locked on center is enabled, set selectedMarker positio to center */
    const onMove = useCallback((e) => {
        if (props.onDrag) {
            props.onDrag(map.getCenter().lat, map.getCenter().lng);
        }

        if (props.pointSelectionLockedOnCenter && selectedMarker) {
            selectedMarker.setLatLng(map.getCenter());
            if (props.onSelectedMarkerChanged) {
                props.onSelectedMarkerChanged(map.getCenter().lat, map.getCenter().lng);
            }
        }
    },[map, selectedMarker, props.pointSelectionLockedOnCenter, props.onDrag, props.onSelectedMarkerChanged]);

    /** When dragging is finished, send setValues with marker position to server, timeout with saveRequest ecause it reset the position without */
    const onMoveEnd = useCallback((e) => {
        if (props.onDragEnd) {
            props.onDragEnd(map.getCenter().lat, map.getCenter().lng);
        }

        if (props.pointSelectionLockedOnCenter && selectedMarker) {
            sendSetValues(props.pointsDataBook, props.name, [props.latitudeColumnName || "LATITUDE", props.longitudeColumnName || "LONGITUDE"], [selectedMarker.getLatLng().lat, selectedMarker.getLatLng().lng], context.server, undefined, topbar);
            setTimeout(() => showTopBar(sendSaveRequest(props.pointsDataBook, true, context.server), topbar), 200);
        }
    },[props.pointSelectionLockedOnCenter, selectedMarker, context.server, props.latitudeColumnName, 
       props.longitudeColumnName, props.name, props.pointsDataBook, props.onDragEnd])

    /** If selectedMarker is set and pointSelectionEnabled and not locked on center, send a setValues with marker position and a saveRequest to the server */
    const onClick = useCallback((e) => {
        if (props.onClick) {
            props.onClick({ originalEvent: e.originalEvent, lat: e.latlng.lat, lng: e.latlng.lng })
        }

        if (selectedMarker && props.pointSelectionEnabled && !props.pointSelectionLockedOnCenter) {
            selectedMarker.setLatLng([e.latlng.lat, e.latlng.lng])
            if (props.onSelectedMarkerChanged) {
                props.onSelectedMarkerChanged(e.latlng.lat, e.latlng.lng);
            }

            sendSetValues(props.pointsDataBook, props.name, [props.latitudeColumnName || "LATITUDE", props.longitudeColumnName || "LONGITUDE"], [e.latlng.lat, e.latlng.lng], context.server, undefined, topbar);
            setTimeout(() => showTopBar(sendSaveRequest(props.pointsDataBook, true, context.server), topbar), 200);
        }
    },[selectedMarker, props.pointSelectionEnabled, props.pointSelectionLockedOnCenter, context.server, 
       props.latitudeColumnName, props.longitudeColumnName, props.name, props.pointsDataBook, props.onClick])

    useMapEvent('move', onMove);
    useMapEvent('moveend', onMoveEnd)
    useMapEvent('click', onClick);

    return (
        <>
            <TileLayer
                className={props.style}
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {
                /** Build markers with icon */
                providedPointData.map((point: any, i: number) => {
                    let iconData:string|IconProps = getMarkerIcon(point, props.markerImageColumnName, props.marker);
                    return <Marker
                        ref={el => markerRefs.current[i] = el}
                        key={props.id + "-Marker-" + i}
                        position={[props.latitudeColumnName ? point[props.latitudeColumnName] : point.LATITUDE ? point.LATITUDE : 0,
                        props.longitudeColumnName ? point[props.longitudeColumnName] : point.LONGITUDE ? point.LONGITUDE : 0]}
                        icon={new L.Icon({
                            iconUrl: context.server.RESOURCE_URL + (typeof iconData === "string" ? iconData as string : (iconData as IconProps).icon),
                            iconAnchor: iconData !== "/com/sibvisions/rad/ui/swing/ext/images/map_defaultmarker.png" ? 
                            (typeof iconData === "string" ? [8, 16] : [((iconData as IconProps).size?.width as number)/2, (iconData as IconProps).size?.height as number]) : [12.5, 41]
                        })} />
                })
            }
            {
                /** Build poligons */
                groupsSorted.map((group, i) => {
                    return <Polygon key={props.id + "-Group-" + i} positions={group.positions} pathOptions={options} />
                })
            }
        </>
    )
}