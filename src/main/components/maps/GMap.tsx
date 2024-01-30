/*global google*/
import React, {CSSProperties, forwardRef, useEffect, useImperativeHandle, useRef, useState} from 'react';
interface IGMap {
    options: any,
    overlays?: any[],
    style: CSSProperties,
    className?: string,
    onMapReady?: Function,
    onMapClick?: Function,
    onMapDragEnd?: Function,
    onZoomChanged?: Function,
    onOverlayDragStart?: Function,
    onOverlayDrag?: Function,
    onOverlayDragEnd?: Function,
    onOverlayClick?: Function,
    ref: any
}

/**
 * In version 9.0.0-rc.1 PrimeReact decided to remove their "GMap" component, as "it is a wrapper and does not add significant value to the library"
 * https://github.com/primefaces/primereact/issues/4038
 * They didn't say about which library they put a wrapper. They just said, to use their wrapper from an old version if you want to use it.
 */

export const GMap: React.ForwardRefExoticComponent<IGMap> = forwardRef((props, ref) => {
    const map = useRef<any>();
    const container = useRef<HTMLDivElement>(null);
    const [overlays, setOverlays] = useState<any>();

    const initMap = () => {
        if (container.current) {
            map.current = new google.maps.Map(container.current, props.options);
        
            if(props.onMapReady) {
                props.onMapReady({
                    map: map.current
                });
            } 
            
            initOverlays(props.overlays);
            
            bindMapEvent('click', props.onMapClick);
            bindMapEvent('dragend', props.onMapDragEnd);
            bindMapEvent('zoom_changed', props.onZoomChanged);
        }
    }

    const initOverlays = (overlays: any) =>  {
        if (overlays) {
            for(let overlay of overlays) {
                overlay.setMap(map.current);
                bindOverlayEvents(overlay);
            }
        }
    }

    const bindOverlayEvents = (overlay: any) => {
        overlay.addListener('click', (event:any) => {
            if(props.onOverlayClick) {
                props.onOverlayClick({
                    originalEvent: event,
                    overlay: overlay,
                    map: map.current
                });
            }
        });
        
        if(overlay.getDraggable()) {
            bindDragEvents(overlay);
        }
    }

    const bindDragEvents = (overlay: any) => {
        bindDragEvent(overlay, 'dragstart', props.onOverlayDragStart);
        bindDragEvent(overlay, 'drag', props.onOverlayDrag);
        bindDragEvent(overlay, 'dragend', props.onOverlayDragEnd);
    }

    const bindDragEvent = (overlay: any, eventName: string, callback?: Function) => {
        overlay.addListener(eventName, (event: any) => {
            if(callback) {
                callback({
                    originalEvent: event,
                    overlay: overlay,
                    map: map.current
                });
            }
        });
    }

    const bindMapEvent = (eventName: string, callback?: Function) => {
        map.current.addListener(eventName, (event: any) => {
            if(callback) {
                callback(event);
            }
        });
    }
    
    const getMap = () => {
        return map.current;
    }

    useEffect(() => {
        initMap();
    }, []);

    useEffect(() => {
        if(overlays !== props.overlays) {
            if(overlays) {
                for(let overlay of overlays) {
                    google.maps.event.clearInstanceListeners(overlay);
                    overlay.setMap(null);
                }
            }
            setOverlays(overlays);
            initOverlays(props.overlays);
        }
    }, [props.overlays]);

    useImperativeHandle(ref, () => {
        return map.current;
    })

    return <div ref={container} style={props.style} className={props.className}></div>
})