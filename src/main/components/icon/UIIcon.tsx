/** React imports */
import React, { FC, useContext, useLayoutEffect, useRef, useState } from "react";

/** Hook imports */
import { useProperties, useImageStyle, useLayoutValue, useMouseListener, usePopupMenu } from "../zhooks";

/** Other imports */
import { appContext } from "../../AppProvider";
import { parseIconData } from "../compprops";
import BaseComponent from "../BaseComponent";
import { parsePrefSize, parseMinSize, parseMaxSize, sendOnLoadCallback, Dimension } from "../util";
import { Tooltip } from "primereact/tooltip";

/**
 * This component displays either a FontAwesome icon or an image sent by the server
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIIcon: FC<BaseComponent> = (baseProps) => {
    /** Reference for the span that is wrapping the icon containing layout information */
    const iconRef = useRef<HTMLSpanElement>(null);
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<BaseComponent>(baseProps.id, baseProps);
    const [preferredSize, setPreferredSize] = useState<Dimension>();
    /** Properties for icon */
    const iconProps = parseIconData(props.foreground, props.image);
    /** Extracting onLoadCallback, id and alignments from baseProps */
    const {onLoadCallback, id, horizontalAlignment, verticalAlignment} = props;
    /**CSS properties for icon */
    const imageStyle = useImageStyle(horizontalAlignment, verticalAlignment, undefined, undefined)
    /** get the layout style value */
    const layoutStyle = useLayoutValue(props.id);
    /** Hook for MouseListener */
    useMouseListener(props.name, iconRef.current ? iconRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    const [iconIsLoaded, setIconIsLoaded] = useState<boolean>(false);

    const popupMenu = usePopupMenu(props);
    
    /**
     * When the icon is loaded, measure the icon and then report its preferred-, minimum-, maximum and measured-size to the layout.
     * Only gets called when the icon is an image and not FontAwesome
     * @param event - icon load event
     */
    const iconLoaded = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const prefSize:Dimension = {width: 0, height: 0}
        if (props.preferredSize) {
            const parsedSize = parsePrefSize(props.preferredSize) as Dimension
            prefSize.height = parsedSize.height;
            prefSize.width = parsedSize.width;
            setPreferredSize(prefSize)
        } 
        else {
            prefSize.height = event.currentTarget.height;
            prefSize.width = event.currentTarget.width;
        }
        if (onLoadCallback) {
            sendOnLoadCallback(id, prefSize, parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), undefined, onLoadCallback);
        }

        setIconIsLoaded(true);
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
                return <i id={props.name} {...popupMenu} className={icon} data-pr-tooltip={props.toolTipText} />
            else {
                return (
                <img
                    id={props.name}
                    {...popupMenu}
                    alt="icon"
                    src={context.server.RESOURCE_URL + iconProps.icon}
                    className={imageStyle && iconIsLoaded ? imageStyle : ""}
                    //style={{height: preferredSize?.height, width: preferredSize?.width }}
                    onLoad={iconLoaded}
                    onError={iconLoaded}
                    data-pr-tooltip={props.toolTipText} />
                )
            }
                
        }
    }

    return (
        <span 
            ref={iconRef} 
            className={"rc-icon" + (props.name === "Validator" ? " rc-validator" : "")} 
            style={{...layoutStyle, overflow: "hidden"}}
        >
            <Tooltip target={"#" + props.name} />
            {iconOrImage(iconProps.icon)}
        </span>
    )
}
export default UIIcon