/*global google*/
import React, {CSSProperties, Component, FC, forwardRef, useEffect, useImperativeHandle, useRef, useState} from 'react';
import PropTypes from 'prop-types';

// export class GMap extends Component {

//     static defaultProps = {
//         options: null,
//         overlays: null,
//         style: null,
//         className: null,
//         onMapReady: null,
//         onMapClick: null,
//         onMapDragEnd: null,
//         onZoomChanged: null,
//         onOverlayDragStart: null,
//         onOverlayDrag: null,
//         onOverlayDragEnd: null,
//         onOverlayClick: null
//     }

//     static propTypes = {
//         options: PropTypes.object,
//         overlays: PropTypes.array,
//         style: PropTypes.object,
//         className: PropTypes.string,
//         onMapReady: PropTypes.func,
//         onMapClick: PropTypes.func,
//         onMapDragEnd: PropTypes.func,
//         onZoomChanged: PropTypes.func,
//         onOverlayDragStart: PropTypes.func,
//         onOverlayDrag: PropTypes.func,
//         onOverlayDragEnd: PropTypes.func,
//         onOverlayClick: PropTypes.func
//     };
    
//     componentDidUpdate(prevProps, prevState, snapshot) {
//         if(prevProps.overlays !== this.props.overlays) {
//             if(prevProps.overlays) {
//                 for(let overlay of prevProps.overlays) {
//                     google.maps.event.clearInstanceListeners(overlay);
//                     overlay.setMap(null);
//                 }
//             }
            
//             this.initOverlays(this.props.overlays);
//         }
//     }
    
//     render() {
//         return (
//             <div ref={(el) => this.container = el} style={this.props.style} className={this.props.className}></div>
//         );
//     }
// }

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