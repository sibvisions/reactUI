import React, {FC, useContext, useLayoutEffect, useRef} from "react";
import {LayoutContext} from "../../LayoutContext";
import {jvxContext} from "../../jvxProvider";
import useProperties from "../zhooks/useProperties";
import {parseIconData} from "../compprops/ComponentProperties";
import BaseComponent from "../BaseComponent";
import { sendOnLoadCallback } from "../util/sendOnLoadCallback";
import useImageStyle from "../zhooks/useImageStyle";
import { parseJVxSize } from "../util/parseJVxSize";
import Size from "../util/Size"

const UIIcon: FC<BaseComponent> = (baseProps) => {

    const iconRef = useRef<HTMLSpanElement>(null);
    const context = useContext(jvxContext);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<BaseComponent>(baseProps.id, baseProps);
    const iconProps = parseIconData(props.foreground, props.image)
    const {onLoadCallback, id, horizontalAlignment, verticalAlignment} = props;
    const imageStyle = useImageStyle(horizontalAlignment, verticalAlignment, undefined, undefined)

    const iconLoaded = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const prefSize:Size = {width: 0, height: 0}
        if (props.preferredSize) {
            const parsedSize = parseJVxSize(props.preferredSize) as Size
            prefSize.height = parsedSize.height;
            prefSize.width = parsedSize.width;
        } 
        else {
            prefSize.height = event.currentTarget.height;
            prefSize.width = event.currentTarget.width;
        }
        if (onLoadCallback) {
            //@ts-ignore
            iconRef.current.children[0].style.setProperty('height', prefSize.height+'px');
            //@ts-ignore
            iconRef.current.children[0].style.setProperty('width', prefSize.width+'px');
            sendOnLoadCallback(id, prefSize, parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), undefined, onLoadCallback);
        }
    }

    useLayoutEffect(() => {
        if(onLoadCallback && iconRef.current){
            if (iconProps.icon?.includes('fa fa-')) {
                sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), iconRef.current, onLoadCallback)
            }
        }
    },[onLoadCallback, id, iconProps.icon, props.preferredSize, props.maximumSize, props.minimumSize]);

    const iconOrImage = (icon:string|undefined) => {
        if (icon) {
            if(icon.includes('fa fa-'))
                return <i className={icon}/>
            else {
                return <img
                alt="icon"
                src={context.server.RESOURCE_URL + iconProps.icon}
                style={imageStyle.img}
                onLoad={iconLoaded}
                onError={iconLoaded}/>
            }
                
        }
    }

    

    return (
        <span ref={iconRef} className={"jvx-icon" + (props.name === "Validator" ? " jvx-validator" : "")} style={{...layoutValue.get(props.id), ...imageStyle.span}}>
            {iconOrImage(iconProps.icon)}
        </span>
    )
}
export default UIIcon