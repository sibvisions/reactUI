/* global google */
/** React imports */
import React, { FC, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

/** 3rd Party imports */
import { GMap } from 'primereact/gmap';
import tinycolor from 'tinycolor2';

/** Hook imports */
import { useProperties, useDataProviderData, useLayoutValue, useMouseListener } from "../zhooks";

/** Other imports */
import { appContext } from "../../AppProvider";
import { getMarkerIcon, 
         parseMapLocation, 
         parsePrefSize, 
         parseMinSize, 
         parseMaxSize, 
         sendOnLoadCallback, 
         sendSetValues, 
         sendMapFetchRequests, 
         sortGroupDataGoogle, 
         sendSaveRequest } from "../util";
import { IMap } from ".";
import { IconProps } from "../compprops";
import { showTopBar, TopBarContext } from "../topbar/TopBar";
import { createFetchRequest } from "../../factories/RequestFactory";
import { REQUEST_ENDPOINTS } from "../../request";
import { FetchResponse } from "../../response";

/**
 * This component displays a map view with Google Maps
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIMapGoogle: FC<IMap> = (baseProps) => {
    /** Reference for the div that is wrapping the map containing layout information */
    const mapWrapperRef = useRef<any>(null);
    /** Reference for the map element */
    const mapInnerRef = useRef(null);
    /** The state if the map is loaded and ready */
    const [mapReady, setMapReady] = useState<boolean>(false);
    /** The marker used for the point Selection.*/
    const [selectedMarker, setSelectedMarker] = useState<google.maps.Marker>();
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<IMap>(baseProps.id, baseProps);
    /** get the layout style value */
    const layoutStyle = useLayoutValue(props.id);
    /** ComponentId of the screen */
    const compId = context.contentStore.getComponentId(props.id) as string;
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = props;
    /** The center position of the map */
    const centerPosition = parseMapLocation(props.center);
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

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if (onLoadCallback && mapWrapperRef.current) {
            sendOnLoadCallback(id, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), mapWrapperRef.current, onLoadCallback);
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    /** Call the loadGoogleMaps function pass function to set Map ready and API key sent by server */
    useEffect(() => {
        loadGoogleMaps(() => {
            setMapReady(true);
        }, props.apiKey as string);
    },[props.apiKey]);

    useEffect(() => {
        const fetchP = createFetchRequest();
        fetchP.dataProvider = props.pointsDataBook;
        fetchP.fromRow = 0;
        const fetchG = createFetchRequest();
        fetchG.dataProvider = props.groupDataBook;
        fetchG.fromRow = 0;
        Promise.all([context.server.sendRequest(fetchP, REQUEST_ENDPOINTS.FETCH), context.server.sendRequest(fetchG, REQUEST_ENDPOINTS.FETCH)]).then((res) => {
            const pointData = context.server.buildDatasets((res[0][0] as FetchResponse));
            const groupData = sortGroupDataGoogle(context.server.buildDatasets((res[1][0] as FetchResponse)), props.groupColumnName, props.latitudeColumnName, props.longitudeColumnName);
            if (mapInnerRef.current) {
                //@ts-ignore
                const map = mapInnerRef.current.map
                const latColName = props.latitudeColumnName;
                const lngColname = props.longitudeColumnName;
                /** If there are marker/points, create the marker at the position with the correct icon, if it is the last marker, set it as selectedMarker */
                if (pointData.length) {
                    pointData.forEach((point: any, i: number) => {
                        let iconData: string | IconProps = getMarkerIcon(point, props.markerImageColumnName, props.marker);
                        const marker = new google.maps.Marker({ position: { lat: latColName ? point[latColName] : point.LATITUDE, lng: lngColname ? point[lngColname] : point.LONGITUDE }, icon: context.server.RESOURCE_URL + (typeof iconData === "string" ? iconData as string : (iconData as IconProps).icon) });
                        marker.setMap(map);
                        if (i === pointData.length - 1)
                            setSelectedMarker(marker);
                    });
                }
                /** If there are groups, create a poligon */
                if (groupData.length) {
                    groupData.forEach((group) => {
                        const polygon = new google.maps.Polygon({ paths: group.paths, strokeColor: polyColors.strokeColor, fillColor: polyColors.fillColor });
                        polygon.setMap(map)
                    });
                }
            }
        })
    }, [context.server, polyColors.fillColor, polyColors.strokeColor, props.groupColumnName, 
        props.groupDataBook, props.latitudeColumnName, props.longitudeColumnName, props.marker, 
        props.markerImageColumnName, props.pointsDataBook]);

    /** 
     *  At start set center to selectedMarker position
     *  if pointSelectionLockedOnCenter the selectedMarker will always be in the center 
     */
    useEffect(() => {
        if (mapInnerRef.current) {
            //@ts-ignore
            const map = mapInnerRef.current.map
            if (selectedMarker) {
                if (!props.center)
                    map.panTo({lat: selectedMarker.getPosition()?.lat(), lng: selectedMarker.getPosition()?.lng()});
                if (props.pointSelectionLockedOnCenter)
                    selectedMarker.setPosition({lat: map.getCenter().lat(), lng: map.getCenter().lng()})
            }
        }
    })

    /** 
     * Adds eventlisteners to the map
     * @returns removes the eventlisteners
     */
    useEffect(() => {
        if (mapInnerRef.current) {
            //@ts-ignore
            const map = mapInnerRef.current.map

            /** If selectedMarker is set and pointSelectionEnabled and not locked on center, send a setValues with marker position and a saveRequest to the server */
            const onClick = (e:any) => {
                if (selectedMarker && props.pointSelectionEnabled && !props.pointSelectionLockedOnCenter) {
                    selectedMarker.setPosition({lat: e.latLng.lat(), lng: e.latLng.lng()})
                    showTopBar(sendSetValues(props.pointsDataBook, props.name, [props.latitudeColumnName || "LATITUDE", props.longitudeColumnName || "LONGITUDE"], [e.latLng.lat(), e.latLng.lng()], context.server), topbar);
                    showTopBar(sendSaveRequest(props.pointsDataBook, true, context.server), topbar)
                }
            }

            /** When the map is dragged and there is a selectedMarker and locked on center is enabled, set selectedMarker positio to center */
            const onDrag = () => {
                 if (selectedMarker && props.pointSelectionLockedOnCenter)
                     selectedMarker.setPosition({lat: map.getCenter().lat(), lng: map.getCenter().lng()});
            }

            /** When dragging is finished, send setValues with marker position to server, timeout with saveRequest ecause it reset the position without */
            const onDragEnd = () => {
                if (selectedMarker && props.pointSelectionLockedOnCenter) {
                    sendSetValues(props.pointsDataBook, props.name, [props.latitudeColumnName || "LATITUDE", props.longitudeColumnName || "LONGITUDE"], [selectedMarker.getPosition()?.lat(), selectedMarker.getPosition()?.lng()], context.server);
                    setTimeout(() => showTopBar(sendSaveRequest(props.pointsDataBook, true, context.server), topbar), 200);
                }
            }

            /** Change position of selectedMarker to center when zoom is changed and locked on center is enabled */
            const onZoomChanged = () => {
                if (selectedMarker && props.pointSelectionLockedOnCenter) {
                    selectedMarker.setPosition({lat: map.getCenter().lat(), lng: map.getCenter().lng()});
                    sendSetValues(props.pointsDataBook, props.name, [props.latitudeColumnName || "LATITUDE", props.longitudeColumnName || "LONGITUDE"], [selectedMarker.getPosition()?.lat(), selectedMarker.getPosition()?.lng()], context.server);
                    setTimeout(() => showTopBar(sendSaveRequest(props.pointsDataBook, true, context.server), topbar), 200);
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
       props.pointsDataBook]
    );

    /** If the map is not ready, return just a div width set size so it can report its size and initialize */
    if (mapReady === false)
        return <div ref={mapWrapperRef} id={props.name} style={{width: '100px', height: '100px'}}/>
    return (
        <div ref={mapWrapperRef} id={props.name} style={layoutStyle}>
            <GMap ref={mapInnerRef} options={options} style={{height: layoutStyle?.height, width: layoutStyle?.width}} />
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