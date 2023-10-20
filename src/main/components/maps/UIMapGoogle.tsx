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

/* global google */
import React, { FC, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { GMap } from 'primereact/gmap';
import tinycolor from 'tinycolor2';
import { showTopBar } from "../topbar/TopBar";
import { createFetchRequest } from "../../factories/RequestFactory";
import { IMap } from "./UIMapOSM";
import useComponentConstants from "../../hooks/components-hooks/useComponentConstants";
import { parseMapLocation, parseMaxSize, parseMinSize, parsePrefSize } from "../../util/component-util/SizeUtil";
import useDataProviderData from "../../hooks/data-hooks/useDataProviderData";
import useMouseListener from "../../hooks/event-hooks/useMouseListener";
import usePopupMenu from "../../hooks/data-hooks/usePopupMenu";
import { sendOnLoadCallback } from "../../util/server-util/SendOnLoadCallback";
import REQUEST_KEYWORDS from "../../request/REQUEST_KEYWORDS";
import IconProps from "../comp-props/IconProps";
import { getMarkerIcon } from "../../util/component-util/GetMarkerIcon";
import { sortGroupDataGoogle } from "../../util/component-util/SortGroupData";
import { sendSetValues } from "../../util/server-util/SendSetValues";
import { sendSaveRequest } from "../../util/server-util/SendSaveRequest";

import { getTabIndex } from "../../util/component-util/GetTabIndex";
import { IExtendableMapGoogle } from "../../extend-components/maps/ExtendMapGoogle";
import useAddLayoutStyle from "../../hooks/style-hooks/useAddLayoutStyle";
import { concatClassnames } from "../../util/string-util/ConcatClassnames";

/**
 * This component displays a map view with Google Maps
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIMapGoogle: FC<IMap & IExtendableMapGoogle> = (baseProps) => {
    /** Reference for the div that is wrapping the map containing layout information */
    const mapWrapperRef = useRef<any>(null);

    /** Reference for the map element */
    const mapInnerRef = useRef(null);

    /** Component constants */
    const [context, [props], layoutStyle,, styleClassNames] = useComponentConstants<IMap & IExtendableMapGoogle>(baseProps);

    /** The state if the map is loaded and ready */
    const [mapReady, setMapReady] = useState<boolean>(false);

    /** The marker used for the point Selection.*/
    const [selectedMarker, setSelectedMarker] = useState<google.maps.Marker>();

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = props;

    /** The center position of the map */
    const centerPosition = useMemo(() => parseMapLocation(props.center), [props.center]);

    /** ComponentId of the screen */
    const screenName = context.contentStore.getScreenName(props.id, props.pointsDataBook || props.groupDataBook) as string;

    /** The provided data for groups */
    const [providedGroupData] = useDataProviderData(screenName, props.groupDataBook);

    /** The provided data for points/markers */
    const [providedPointData] = useDataProviderData(screenName, props.pointsDataBook);

    /** Hook for MouseListener */
    useMouseListener(props.name, mapWrapperRef.current ? mapWrapperRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** Options for map controls/display */
    const options = {
        center: centerPosition ? { lat: centerPosition.latitude, lng: centerPosition.longitude} : { lat: 0, lng: 0 },
        disableDefaultUI: true,
        fullscreenControl: true,
        mapTypeControl: false,
        rotateControl: false,
        scaleControl: false,
        draggableCursor: 'default',
        streetViewControl: false,
        zoom: props.zoomLevel || 9,
        zoomControl: true
    };

    /** Colors for polygon filling and polygon lines */
    const polyColors = {
        strokeColor: props.lineColor ? props.lineColor : tinycolor("rgba (200, 0, 0, 210)").toHexString(),
        fillColor: props.fillColor ? props.fillColor : tinycolor("rgba (202, 39, 41, 41)").toHexString(),
    }

    /** The popup-menu of the Map */
    const popupMenu = usePopupMenu(props);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if (onLoadCallback && mapWrapperRef.current) {
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), mapWrapperRef.current, onLoadCallback);
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    useAddLayoutStyle(mapWrapperRef.current, layoutStyle, onLoadCallback);

    /** Call the loadGoogleMaps function pass function to set Map ready and API key sent by server */
    useEffect(() => {
        loadGoogleMaps(() => {
            setMapReady(true);
        }, props.apiKey as string);
    },[props.apiKey]);

    // Fetches the point and the group databook
    useEffect(() => {
        const fetchP = createFetchRequest();
        fetchP.dataProvider = props.pointsDataBook;
        fetchP.fromRow = 0;
        const fetchG = createFetchRequest();
        fetchG.dataProvider = props.groupDataBook;
        fetchG.fromRow = 0;
        if (props.pointsDataBook) {
            context.server.sendRequest(fetchP, REQUEST_KEYWORDS.FETCH);
        }

        if (props.groupDataBook) {
            context.server.sendRequest(fetchG, REQUEST_KEYWORDS.FETCH);
        }
    }, []);

    // Creates the markers based on the providedPointData and sets the selected-marker for the last marker.
    useEffect(() => {
        if (mapInnerRef.current && providedPointData) {
            //@ts-ignore
            const map = mapInnerRef.current.map

            const latColName = props.latitudeColumnName;
            const lngColname = props.longitudeColumnName;
            providedPointData.forEach((point: any, i: number) => {
                let iconData: string | IconProps = getMarkerIcon(point, props.markerImageColumnName, props.marker);
                const marker = new google.maps.Marker({ position: { lat: latColName ? point[latColName] : point.LATITUDE, lng: lngColname ? point[lngColname] : point.LONGITUDE }, icon: context.server.RESOURCE_URL + (typeof iconData === "string" ? iconData as string : (iconData as IconProps).icon) });
                marker.setMap(map);
                if (i === providedPointData.length - 1) {
                    setSelectedMarker(marker);
                }
            })
        }
    }, [providedPointData, mapReady]);

    // Creates google maps polygons based on the groupdatas
    useEffect(() => {
        if (mapInnerRef.current && providedGroupData) {
            //@ts-ignore
            const map = mapInnerRef.current.map

            const groupData = sortGroupDataGoogle(providedGroupData, props.groupColumnName, props.latitudeColumnName, props.longitudeColumnName);
            if (groupData.length) {
                groupData.forEach((group) => {
                    const polygon = new google.maps.Polygon({ paths: group.paths, strokeColor: polyColors.strokeColor, fillColor: polyColors.fillColor });
                    polygon.setMap(map)
                });
            }
        }
    }, [providedGroupData, mapReady]);

    /** 
     *  At start set center to selectedMarker position
     *  if pointSelectionLockedOnCenter the selectedMarker will always be in the center 
     */
    useEffect(() => {
        if (mapInnerRef.current) {
            //@ts-ignore
            const map = mapInnerRef.current.map
            if (selectedMarker) {
                if (!props.center) {
                    map.panTo({lat: selectedMarker.getPosition()?.lat(), lng: selectedMarker.getPosition()?.lng()});
                }
                    
                if (props.pointSelectionLockedOnCenter) {
                    selectedMarker.setPosition({lat: map.getCenter().lat(), lng: map.getCenter().lng()})
                }
            }
        }
    }, []);

    // pans to the centerposition, initially or when the centerposition changes
    useEffect(() => {
        if (centerPosition && mapInnerRef.current) {
            //@ts-ignore
            const map = mapInnerRef.current.map
            map.panTo({lat: centerPosition.latitude, lng: centerPosition.longitude})
        }
    }, [centerPosition])

    // If the lib user extends the Map with onSelectedMarkerChanged, call it when the selected-marker changes.
    useEffect(() => {
        if (props.onSelectedMarkerChanged) {
            props.onSelectedMarkerChanged(selectedMarker?.getPosition()?.lat(), selectedMarker?.getPosition()?.lng());
        }
    }, [selectedMarker, props.onSelectedMarkerChanged])

    /** 
     * Adds eventlisteners to the map
     * @returns removes the eventlisteners
     */
    useEffect(() => {
        if (mapInnerRef.current) {
            //@ts-ignore
            const map = mapInnerRef.current.map

            // If selectedMarker is set and pointSelectionEnabled and not locked on center, send a setValues with marker position and a saveRequest to the server
            // If the lib user extends the Icon with onClick, call it when the Map is clicked.
            const onClick = (e:any) => {
                if (props.onClick) {
                    props.onClick({ originalEvent: e.domEvent, lat: e.latLng.lat(), lng: e.latLng.lng() });
                }

                if (selectedMarker && props.pointSelectionEnabled && !props.pointSelectionLockedOnCenter) {
                    selectedMarker.setPosition({lat: e.latLng.lat(), lng: e.latLng.lng()})
                    sendSetValues(props.pointsDataBook, props.name, [props.latitudeColumnName || "LATITUDE", props.longitudeColumnName || "LONGITUDE"], "" || "LATITUDE", [e.latLng.lat(), e.latLng.lng()], context.server, context.server.topbar);
                    showTopBar(sendSaveRequest(props.pointsDataBook, true, context.server), context.server.topbar)
                }
            }

            // When the map is dragged and there is a selectedMarker and locked on center is enabled, set selectedMarker positio to center
            // If the lib user extends the Map with onDrag, call it when the Map is being dragged.
            const onDrag = () => {
                if (props.onDrag) {
                    props.onDrag(map.getCenter().lat(), map.getCenter().lng());
                }

                 if (selectedMarker && props.pointSelectionLockedOnCenter)
                     selectedMarker.setPosition({lat: map.getCenter().lat(), lng: map.getCenter().lng()});
            }

            // When dragging is finished, send setValues with marker position to server, timeout with saveRequest ecause it reset the position without
            // If the lib user extends the Map with onDragEnd, call it when the map dragging has ended.
            const onDragEnd = () => {
                if (props.onDragEnd) {
                    props.onDragEnd(map.getCenter().lat(), map.getCenter().lng());
                }

                if (selectedMarker && props.pointSelectionLockedOnCenter) {
                    sendSetValues(props.pointsDataBook, props.name, [props.latitudeColumnName || "LATITUDE", props.longitudeColumnName || "LONGITUDE"], "", [selectedMarker.getPosition()?.lat(), selectedMarker.getPosition()?.lng()], context.server, context.server.topbar);
                    setTimeout(() => showTopBar(sendSaveRequest(props.pointsDataBook, true, context.server), context.server.topbar), 200);
                }
            }

            // Change position of selectedMarker to center when zoom is changed and locked on center is enabled
            // If the lib user extends the Map with onZoomChanged, call it when the zoom-level changes.
            const onZoomChanged = () => {
                if (props.onZoomChanged) {
                    props.onZoomChanged(map.getCenter().lat(), map.getCenter().lng());
                }

                if (selectedMarker && props.pointSelectionLockedOnCenter) {
                    selectedMarker.setPosition({lat: map.getCenter().lat(), lng: map.getCenter().lng()});
                    sendSetValues(props.pointsDataBook, props.name, [props.latitudeColumnName || "LATITUDE", props.longitudeColumnName || "LONGITUDE"], "", [selectedMarker.getPosition()?.lat(), selectedMarker.getPosition()?.lng()], context.server, context.server.topbar);
                    setTimeout(() => showTopBar(sendSaveRequest(props.pointsDataBook, true, context.server), context.server.topbar), 200);
                }
            }

            map.addListener("click", onClick);
            map.addListener("drag", onDrag);
            map.addListener("dragend", onDragEnd);
            map.addListener("zoom_changed", onZoomChanged);

            return () => {
                google.maps.event.clearInstanceListeners(map);
            }
        }
    },[selectedMarker, context.server, props.latitudeColumnName, props.longitudeColumnName,
       props.name, props.pointSelectionEnabled, props.pointSelectionLockedOnCenter,
       props.pointsDataBook, props.onClick, props.onDrag, props.onDragEnd, props.onZoomChanged]
    );

    /** If the map is not ready, return just a div width set size so it can report its size and initialize */
    if (mapReady === false)
        return <div ref={mapWrapperRef} id={props.name} style={{width: '100px', height: '100px'}}/>
    return (
        <div ref={mapWrapperRef} className="rc-map-wrapper" {...popupMenu} id={props.name} style={layoutStyle} tabIndex={getTabIndex(props.focusable, props.tabIndex)}>
            <GMap ref={mapInnerRef} className={concatClassnames(styleClassNames)} options={options} style={{height: layoutStyle?.height, width: layoutStyle?.width}} />
        </div>
    )
}
export default UIMapGoogle

/** function to load Google Maps */
const loadGoogleMaps = (callback:any, key:string) => {
	const existingScript = document.getElementById('googleMaps');

	if (!existingScript) {
		const script = document.createElement('script');
		script.src = 'https://maps.googleapis.com/maps/api/js?key=' + key + '&libraries=places';
		script.id = 'googleMaps';
		document.body.appendChild(script);

		script.onload = () => {
			if (callback) callback();
		};
	}

	if (existingScript && callback) callback();
};