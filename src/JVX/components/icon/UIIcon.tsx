/** React imports */
import React, { FC, useContext, useLayoutEffect, useRef, useState } from "react";

/** Hook imports */
import { useProperties, useImageStyle } from "../zhooks";

/** Other imports */
import { LayoutContext } from "../../LayoutContext";
import { jvxContext } from "../../jvxProvider";
import { parseIconData } from "../compprops";
import BaseComponent from "../BaseComponent";
import { parsePrefSize, parseMinSize, parseMaxSize, sendOnLoadCallback, Size } from "../util";

/**
 * This component displays either a FontAwesome icon or an image sent by the server
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIIcon: FC<BaseComponent> = (baseProps) => {
    /** Reference for the span that is wrapping the icon containing layout information */
    const iconRef = useRef<HTMLSpanElement>(null);
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);
    /** Use context for the positioning, size informations of the layout */
    const layoutValue = useContext(LayoutContext);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<BaseComponent>(baseProps.id, baseProps);
    const [preferredSize, setPreferredSize] = useState<Size>();
    /** Properties for icon */
    const iconProps = parseIconData(props.foreground, props.image);
    /** Extracting onLoadCallback, id and alignments from baseProps */
    const {onLoadCallback, id, horizontalAlignment, verticalAlignment} = props;
    /**CSS properties for icon */
    const imageStyle = useImageStyle(horizontalAlignment, verticalAlignment, undefined, undefined)

    /**
     * When the icon is loaded, measure the icon and then report its preferred-, minimum-, maximum and measured-size to the layout.
     * Only gets called when the icon is an image and not FontAwesome
     * @param event - icon load event
     */
    const iconLoaded = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const prefSize:Size = {width: 0, height: 0}
        if (props.preferredSize) {
            const parsedSize = parsePrefSize(props.preferredSize) as Size
            prefSize.height = parsedSize.height;
            prefSize.width = parsedSize.width;
            setPreferredSize(prefSize)
        } 
        else {
            prefSize.height = event.currentTarget.height;
            prefSize.width = event.currentTarget.width;
        }
        if (onLoadCallback)
            sendOnLoadCallback(id, prefSize, parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), undefined, onLoadCallback);
    }

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout when the icon is a FontAwesome icon */
    useLayoutEffect(() => {
        if(onLoadCallback && iconRef.current){
            if (iconProps.icon?.includes('fa fa-')) {
                sendOnLoadCallback(id, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), iconRef.current, onLoadCallback)
            }
        }
    },[onLoadCallback, id, iconProps.icon, props.preferredSize, props.maximumSize, props.minimumSize]);

    /** 
    * Returns wether the icon is a FontAwesome icon or an image sent by the server 
    * @returns Iconelement based on if the icon is FontAwesome or server sent image
    */
    const iconOrImage = (icon:string|undefined) => {
        if (icon) {
            if(icon.includes('fa fa-'))
                return <i className={icon}/>
            else {
                return <img
                alt="icon"
                src={context.server.RESOURCE_URL + iconProps.icon}
                style={{...imageStyle.img, height: preferredSize?.height, width: preferredSize?.width}}
                onLoad={iconLoaded}
                onError={iconLoaded}/>
            }
                
        }
    }

    

    return (
        <span ref={iconRef} className={"rc-icon" + (props.name === "Validator" ? " rc-validator" : "")} style={{...layoutValue.get(props.id), ...imageStyle.span}}>
            {iconOrImage(iconProps.icon)}
        </span>
    )
}
export default UIIcon