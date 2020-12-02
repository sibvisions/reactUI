import React, {FC, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import {jvxContext} from "../../jvxProvider";
import {LayoutContext} from "../../LayoutContext";
import useProperties from "../zhooks/useProperties";
import useDataProviderData from "../zhooks/useDataProviderData";
import {sendOnLoadCallback} from "../util/sendOnLoadCallback";
import {parseJVxLocation, parseJVxSize} from "../util/parseJVxSize";
import BaseComponent from "../BaseComponent";
import {MapContainer, Marker, Polygon, TileLayer, useMap, useMapEvent} from "react-leaflet";
import 'leaflet/dist/leaflet.css';
import {createSaveRequest} from "src/JVX/factories/RequestFactory";
import REQUEST_ENDPOINTS from "src/JVX/request/REQUEST_ENDPOINTS";
import {PolylineOptions} from "leaflet";
import L from 'leaflet'
import tinycolor from 'tinycolor2';
import IconProps from "../compprops/IconProps";
import {parseIconData} from "../compprops/ComponentProperties";
import {sendSetValues} from "../util/SendSetValues";
import { sendMapFetchRequests } from "../util/mapUtils/SendMapFetchRequests";
import { sortGroupDataOSM } from "../util/mapUtils/SortGroupData";
import { getMarkerIcon } from "../util/mapUtils/GetMarkerIcon";
import { sendSaveRequest } from "../util/SendSaveRequest";

export interface IMap extends BaseComponent {
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
    zoomLevel?: number
}

const UIMapOSM: FC<IMap> = (baseProps) => {

    const mapRef = useRef(null);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<IMap>(baseProps.id, baseProps);
    const {onLoadCallback, id} = props;
    const centerPosition = parseJVxLocation(props.center);
    const startZoom = 19 - (props.zoomLevel ? props.zoomLevel : 0);

    useLayoutEffect(() => {
        if (onLoadCallback && mapRef.current) {
            sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), mapRef.current, onLoadCallback);
        }
            
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    //Map can't measure itself, because it needs a set height initially --> before the componentsizes are set by the layout,
    //set a default preferredSize (100x100) the layout can use to calculate. 
    if (layoutValue.has(id)) {
        return (
            <div ref={mapRef} style={layoutValue.get(id)}>
                <MapContainer center={centerPosition ? [centerPosition.latitude, centerPosition.longitude] : [0, 0]} zoom={startZoom} style={{height: layoutValue.get(id)?.height, width: layoutValue.get(id)?.width}}>
                    <UIMapOSMConsumer {...props} zoomLevel={startZoom}/>
                </MapContainer>
            </div>
        )
    }
    else {
        return <div ref={mapRef} style={{width: '100px', height: '100px'}}/>
    }
    

}
export default UIMapOSM

const UIMapOSMConsumer: FC<IMap> = (props) => {
    const map = useMap();
    const markerRefs = useRef<any>([]);
    const context = useContext(jvxContext);
    const compId = context.contentStore.getComponentId(props.id) as string;
    const [providedGroupData] = useDataProviderData(compId, props.id, props.groupDataBook);
    const [providedPointData] = useDataProviderData(compId, props.id, props.pointsDataBook);
    const [selectedMarker, setSelectedMarker] = useState<any>()
    const options:PolylineOptions = {
        color: props.lineColor ? props.lineColor : tinycolor("rgba (200, 0, 0, 210)").toHexString(),
        fillColor: props.fillColor ? props.fillColor : tinycolor("rgba (202, 39, 41, 41)").toHexString(),
        fillOpacity: 1.0
    }

    const groupsSorted = useMemo(() => {
        return sortGroupDataOSM(providedGroupData, props.groupColumnName, props.latitudeColumnName, props.longitudeColumnName);
    },[providedGroupData, props.groupColumnName, props.latitudeColumnName, props.longitudeColumnName]);

    useEffect(() => {
        
        //@ts-ignore
        delete L.Icon.Default.prototype._getIconUrl;

        L.Icon.Default.mergeOptions({
            iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
            iconUrl: require("leaflet/dist/images/marker-icon.png"),
            shadowUrl: require("leaflet/dist/images/marker-shadow.png")
          });

        sendMapFetchRequests(props.groupDataBook, props.pointsDataBook, context.server);
    },[context.server, props.groupDataBook, props.pointsDataBook]);

    useEffect(() => {
        if (markerRefs.current) {
            setSelectedMarker(markerRefs.current.slice(-1).pop())
        }
            
    },[providedPointData])

    useEffect(() => {
        if (selectedMarker) {
            if (!props.center)
                map.setView(selectedMarker.getLatLng(), props.zoomLevel ? props.zoomLevel : 11);
            if (props.pointSelectionLockedOnCenter)
                selectedMarker.setLatLng(map.getCenter())
        }
            
    },[selectedMarker, map, props.center, props.zoomLevel, props.pointSelectionLockedOnCenter]);

    const onMove = useCallback((e) => {
        if (props.pointSelectionLockedOnCenter && selectedMarker)
            selectedMarker.setLatLng(map.getCenter());
    },[map, selectedMarker, props.pointSelectionLockedOnCenter]);

    const onMoveEnd = useCallback((e) => {
        if (props.pointSelectionLockedOnCenter && selectedMarker) {
            sendSetValues(props.pointsDataBook, props.name, [props.latitudeColumnName || "LATITUDE", props.longitudeColumnName || "LONGITUDE"], [selectedMarker.getLatLng().lat, selectedMarker.getLatLng().lng], undefined, context.server);
            sendSaveRequest(props.pointsDataBook, true, context.server)
        }
    },[props.pointSelectionLockedOnCenter, selectedMarker, context.server, props.latitudeColumnName, props.longitudeColumnName, props.name, props.pointsDataBook, sendSaveRequest])

    const onClick = useCallback((e) => {
        if (selectedMarker && props.pointSelectionEnabled && !props.pointSelectionLockedOnCenter) {
            selectedMarker.setLatLng([e.latlng.lat, e.latlng.lng])
            sendSetValues(props.pointsDataBook, props.name, [props.latitudeColumnName || "LATITUDE", props.longitudeColumnName || "LONGITUDE"], [e.latlng.lat, e.latlng.lng], undefined, context.server);
            sendSaveRequest(props.pointsDataBook, true, context.server)
        }
    },[selectedMarker, props.pointSelectionEnabled, props.pointSelectionLockedOnCenter, context.server, props.latitudeColumnName, props.longitudeColumnName, props.name, props.pointsDataBook, sendSaveRequest])

    useMapEvent('move', onMove);
    useMapEvent('moveend', onMoveEnd)
    useMapEvent('click', onClick);

    return (
        <>
            <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {
                providedPointData.map((point: any, i: number) => {
                    let iconData:string|IconProps = getMarkerIcon(point, props.markerImageColumnName, props.marker);
                    return <Marker
                        ref={el => markerRefs.current[i] = el}
                        key={props.id + "-Marker-" + i}
                        position={[props.latitudeColumnName ? point[props.latitudeColumnName] : point.LATITUDE,
                        props.longitudeColumnName ? point[props.longitudeColumnName] : point.LONGITUDE]}
                        icon={new L.Icon({
                            iconUrl: context.server.RESOURCE_URL + (typeof iconData === "string" ? iconData as string : (iconData as IconProps).icon),
                            iconAnchor: iconData !== "/com/sibvisions/rad/ui/swing/ext/images/map_defaultmarker.png" ? 
                            (typeof iconData === "string" ? [8, 16] : [((iconData as IconProps).size?.width as number)/2, (iconData as IconProps).size?.height as number]) : [12.5, 41]
                        })} />
                })
            }
            {
                groupsSorted.map((group, i) => {
                    return <Polygon key={props.id + "-Group-" + i} positions={group.positions} pathOptions={options} />
                })
            }
        </>
    )
}