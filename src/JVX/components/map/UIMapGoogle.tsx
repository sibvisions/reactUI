/* global google */
import React, {FC, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import {GMap} from 'primereact/gmap';
import {jvxContext} from "../../jvxProvider";
import {LayoutContext} from "../../LayoutContext";
import useProperties from "../zhooks/useProperties";
import useDataProviderData from "../zhooks/useDataProviderData";
import {sendOnLoadCallback} from "../util/sendOnLoadCallback";
import {parseJVxLocation, parseJVxSize} from "../util/parseJVxSize";
import {sendSetValues} from "../util/SendSetValues";
import { IMap } from "./UIMapOSM";
import { sendMapFetchRequests } from "../util/mapUtils/SendMapFetchRequests";
import { sortGroupDataGoogle } from "../util/mapUtils/SortGroupData";
import tinycolor from 'tinycolor2';
import IconProps from "../compprops/IconProps";
import { getMarkerIcon } from "../util/mapUtils/GetMarkerIcon";
import { sendSaveRequest } from "../util/SendSaveRequest";

const UIMapGoogle: FC<IMap> = (baseProps) => {
    
    //Hooks, Variables
    const mapWrapperRef = useRef(null);
    const mapInnerRef = useRef(null)
    const [mapReady, setMapReady] = useState<boolean>(false);
    const [selectedMarker, setSelectedMarker] = useState<google.maps.Marker>()
    const [dataSet, setDataSet] = useState<boolean>(false);
    const [props] = useProperties<IMap>(baseProps.id, baseProps);
    const context = useContext(jvxContext);
    const layoutValue = useContext(LayoutContext);
    const compId = context.contentStore.getComponentId(props.id) as string;
    const [providedGroupData] = useDataProviderData(compId, props.id, props.groupDataBook);
    const [providedPointData] = useDataProviderData(compId, props.id, props.pointsDataBook);
    const {onLoadCallback, id} = props;
    const centerPosition = parseJVxLocation(props.center);
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
    const polyColors = {
        strokeColor: props.lineColor ? props.lineColor : tinycolor("rgba (200, 0, 0, 210)").toHexString(),
        fillColor: props.fillColor ? props.fillColor : tinycolor("rgba (202, 39, 41, 41)").toHexString(),
    }
    const groupsSorted = useMemo(() => {
        return sortGroupDataGoogle(providedGroupData, props.groupColumnName, props.latitudeColumnName, props.longitudeColumnName);
    },[providedGroupData, props.groupColumnName, props.latitudeColumnName, props.longitudeColumnName]);

    //Size reporting
    useLayoutEffect(() => {
        if (onLoadCallback && mapWrapperRef.current) {
            sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), mapWrapperRef.current, onLoadCallback);
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    //Load Map
    useEffect(() => {
        loadGoogleMaps(() => {
            setMapReady(true);
        }, props.apiKey as string);
    },[props.apiKey]);

    //Fetch Data (Groups, Points)
    useEffect(() => {
        sendMapFetchRequests(props.groupDataBook, props.pointsDataBook, context.server);
    },[context.server, props.groupDataBook, props.pointsDataBook]);

    //Add Data to Map
    useEffect(() => {
        if (!dataSet && providedPointData.length && providedGroupData.length) {
            
            if (mapInnerRef.current) {
                console.log(providedPointData, providedGroupData)
                //@ts-ignore
                const map = mapInnerRef.current.map
                const latColName = props.latitudeColumnName;
                const lngColname = props.longitudeColumnName;
                providedPointData.forEach((point, i) => {
                    let iconData:string|IconProps = getMarkerIcon(point, props.markerImageColumnName, props.marker);
                    const marker = new google.maps.Marker({position: {lat: latColName ? point[latColName] : point.LATITUDE, lng: lngColname ? point[lngColname] : point.LONGITUDE}, icon: context.server.RESOURCE_URL + (typeof iconData === "string" ? iconData as string : (iconData as IconProps).icon)});
                    marker.setMap(map);
                    console.log(marker, i)
                    if (i === providedPointData.length - 1)
                        setSelectedMarker(marker);
                });
                groupsSorted.forEach((group) => {
                    const polygon = new google.maps.Polygon({paths: group.paths, strokeColor: polyColors.strokeColor, fillColor: polyColors.fillColor});
                    polygon.setMap(map)
                });
                setDataSet(true)
            }
        }

    }, [providedPointData, groupsSorted, props.longitudeColumnName, props.latitudeColumnName, 
        polyColors.strokeColor, polyColors.fillColor, context.server.RESOURCE_URL, 
        props.marker, props.markerImageColumnName, dataSet, providedGroupData]
    );

    //At Start set center or set point if pointSelectionLockedOnCenter
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

    //Event Handling
    useEffect(() => {
        if (mapInnerRef.current) {
            //@ts-ignore
            const map = mapInnerRef.current.map

            const onClick = (e:any) => {
                if (selectedMarker && props.pointSelectionEnabled && !props.pointSelectionLockedOnCenter) {
                    selectedMarker.setPosition({lat: e.latLng.lat(), lng: e.latLng.lng()})
                    sendSetValues(props.pointsDataBook, props.name, [props.latitudeColumnName || "LATITUDE", props.longitudeColumnName || "LONGITUDE"], [e.latLng.lat(), e.latLng.lng()], undefined, context.server);
                    sendSaveRequest(props.pointsDataBook, true, context.server)
                }
            }

            const onDrag = () => {
                 if (selectedMarker && props.pointSelectionLockedOnCenter)
                     selectedMarker.setPosition({lat: map.getCenter().lat(), lng: map.getCenter().lng()});
            }

            const onDragEnd = () => {
                if (selectedMarker && props.pointSelectionLockedOnCenter) {
                    sendSetValues(props.pointsDataBook, props.name, [props.latitudeColumnName || "LATITUDE", props.longitudeColumnName || "LONGITUDE"], [selectedMarker.getPosition()?.lat(), selectedMarker.getPosition()?.lng()], undefined, context.server);
                    setTimeout(() => sendSaveRequest(props.pointsDataBook, true, context.server), 200);
                }
            }

            const onZoomChanged = () => {
                if (selectedMarker && props.pointSelectionLockedOnCenter) {
                    selectedMarker.setPosition({lat: map.getCenter().lat(), lng: map.getCenter().lng()});
                    sendSetValues(props.pointsDataBook, props.name, [props.latitudeColumnName || "LATITUDE", props.longitudeColumnName || "LONGITUDE"], [selectedMarker.getPosition()?.lat(), selectedMarker.getPosition()?.lng()], undefined, context.server);
                    setTimeout(() => sendSaveRequest(props.pointsDataBook, true, context.server), 200);
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

    if (mapReady === false)
        return <div ref={mapWrapperRef} style={{width: '100px', height: '100px'}}/>
    return (
        <div ref={mapWrapperRef} style={layoutValue.get(id)}>
            <GMap ref={mapInnerRef} options={options} style={{height: layoutValue.get(id)?.height, width: layoutValue.get(id)?.width}} />
        </div>
    )
}
export default UIMapGoogle

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