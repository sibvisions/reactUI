import React, {FC, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import {jvxContext} from "../../jvxProvider";
import {LayoutContext} from "../../LayoutContext";
import useProperties from "../zhooks/useProperties";
import useDataProviderData from "../zhooks/useDataProviderData";
import {sendOnLoadCallback} from "../util/sendOnLoadCallback";
import {parseJVxLocation, parseJVxSize} from "../util/parseJVxSize";
import BaseComponent from "../BaseComponent";
import {MapContainer, Marker, MarkerProps, Polygon, TileLayer, useMap, useMapEvent} from "react-leaflet";
import 'leaflet/dist/leaflet.css';
import { createFetchRequest } from "src/JVX/factories/RequestFactory";
import REQUEST_ENDPOINTS from "src/JVX/request/REQUEST_ENDPOINTS";
import {LatLngExpression, PolylineOptions} from "leaflet";
import L from 'leaflet'
import tinycolor from 'tinycolor2';

export interface IMap extends BaseComponent {
    center: string
    groupDataBook: string
    pointsDataBook: string
    pointSelectionEnabled: boolean
    pointSelectionLockedOnCenter: boolean
    zoomLevel: number
}

type MapPoint = {
    LATITUDE: number
    LONGITUDE: number
    MARKER_IMAGE: string
}

type MapGroup = {
    LATITUDE: number
    LONGITUDE: number
    GROUP: string
}

const UIMap: FC<IMap> = (baseProps) => {

    const mapRef = useRef(null);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<IMap>(baseProps.id, baseProps);
    const {onLoadCallback, id} = props;
    const centerPosition = parseJVxLocation(props.center);
    const startZoom = 19 - props.zoomLevel;

    useLayoutEffect(() => {
        if (onLoadCallback && mapRef.current) {
            sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), mapRef.current, onLoadCallback);
        }
            
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    console.log(centerPosition)

    //Map can't measure itself, because it needs a set height initially --> before the componentsizes are set by the layout,
    //set a default preferredSize (100x100) the layout can use to calculate. 
    if (layoutValue.has(id)) {
        return (
            <div ref={mapRef} style={layoutValue.get(id)}>
                <MapContainer center={centerPosition ? [centerPosition.latitude, centerPosition.longitude] : [0, 0]} zoom={startZoom} style={{height: layoutValue.get(id)?.height, width: layoutValue.get(id)?.width}}>
                    <UIMapTest {...props} zoomLevel={startZoom}/>
                </MapContainer>
            </div>
        )
    }
    else {
        return <div ref={mapRef} style={{width: '100px', height: '100px'}}/>
    }
    

}
export default UIMap

const UIMapTest: FC<IMap> = (props) => {
    const map = useMap();
    const markerRefs = useRef<any>([]);
    const context = useContext(jvxContext);
    const [providedGroupData] = useDataProviderData(props.id, props.groupDataBook);
    const [providedPointData] = useDataProviderData(props.id, props.pointsDataBook);
    const [selectedMarker, setSelectedMarker] = useState<any>()
    const defaultOptions:PolylineOptions = {
        color: tinycolor("rgba (200, 0, 0, 210)").toHexString(),
        fillColor: tinycolor("rgba (202, 39, 41, 41)").toHexString()
    }
        

    const groupsSorted = useMemo(() => {
        const groupMap:Array<any> = []
        providedGroupData.forEach((groupPoint:MapGroup) => {
            const foundGroup = groupMap.find(existingGroup => existingGroup.GROUP = groupPoint.GROUP);
            if (foundGroup) {
                const tempArray:LatLngExpression = [groupPoint.LATITUDE, groupPoint.LONGITUDE];
                foundGroup.positions.push(tempArray);
            }
            else {
                const temp:any = {GROUP: groupPoint.GROUP, positions: [[groupPoint.LATITUDE, groupPoint.LONGITUDE]]};
                groupMap.push(temp);
            }
        })
        return groupMap
    }, [providedGroupData]);

    useEffect(() => {
        
        //@ts-ignore
        delete L.Icon.Default.prototype._getIconUrl;

        L.Icon.Default.mergeOptions({
            iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
            iconUrl: require("leaflet/dist/images/marker-icon.png"),
            shadowUrl: require("leaflet/dist/images/marker-shadow.png")
          });

          const sendFetchRequest = (dataProvider:string) => {
            const fetchReq = createFetchRequest();
            fetchReq.dataProvider = dataProvider;
            fetchReq.fromRow = 0;
            context.server.sendRequest(fetchReq, REQUEST_ENDPOINTS.FETCH)
        }
        sendFetchRequest(props.groupDataBook);
        sendFetchRequest(props.pointsDataBook);
    },[context.server, props.groupDataBook, props.pointsDataBook]);

    useEffect(() => {
        if (markerRefs.current) {
            setSelectedMarker(markerRefs.current.slice(-1).pop())
        }
            
    },[providedPointData])

    useEffect(() => {
        if (selectedMarker && !props.center)
            map.setView(selectedMarker.getLatLng(), props.zoomLevel);     
    },[selectedMarker, map]);

    const onMove = useCallback((e) => {
           if (props.pointSelectionLockedOnCenter && selectedMarker)
              selectedMarker.setLatLng(map.getCenter());
    },[map, selectedMarker, props.pointSelectionLockedOnCenter]);

    useMapEvent('move', onMove);

    return (
        <>
            <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {
                providedPointData.map((point: MapPoint, i: number) => {
                    if (point.LATITUDE !== null && point.LONGITUDE !== null) {
                        const markerProps: MarkerProps = { position: [point.LATITUDE, point.LONGITUDE] }
                        if (point.MARKER_IMAGE)
                            markerProps.icon = new L.Icon({ iconUrl: context.server.RESOURCE_URL + point.MARKER_IMAGE, iconAnchor: [8, 16] })
                        return <Marker 
                                    ref={el => markerRefs.current[i] = el} 
                                    position={[point.LATITUDE, point.LONGITUDE]} 
                                    icon={new L.Icon({ 
                                        iconUrl: context.server.RESOURCE_URL + (point.MARKER_IMAGE ? point.MARKER_IMAGE : "/com/sibvisions/rad/ui/swing/ext/images/map_defaultmarker.png"),
                                        iconAnchor: point.MARKER_IMAGE ? [8, 16] : [12.5, 41]
                                    })} />
                    }
                })
            }
            {
                groupsSorted.map((group) => {
                    return <Polygon positions={group.positions} pathOptions={defaultOptions} />
                })
            }
        </>
    )
}