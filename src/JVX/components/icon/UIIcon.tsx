import React, {FC, useContext, useLayoutEffect, useRef} from "react";
import './UIIcon.scss'
import {LayoutContext} from "../../LayoutContext";
import {jvxContext} from "../../jvxProvider";
import useProperties from "../zhooks/useProperties";
import {parseIconData} from "../compprops/ComponentProperties";
import BaseComponent from "../BaseComponent";
import { sendOnLoadCallback } from "../util/sendOnLoadCallback";

const UIIcon: FC<BaseComponent> = (baseProps) => {

    const iconRef = useRef<HTMLSpanElement>(null);
    const context = useContext(jvxContext);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<BaseComponent>(baseProps.id, baseProps);
    const iconProps = parseIconData(props.foreground, props.image)
    const {onLoadCallback, id} = baseProps;

    const iconLoaded = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
        let height:number, width:number;
        if (props.preferredSize) {
            const size = props.preferredSize.split(",");
            height = parseInt(size[1]);
            width = parseInt(size[0]);
        } 
        else {
            height = event.currentTarget.height;
            width = event.currentTarget.width;
        }

        if (onLoadCallback) {
            onLoadCallback(id, height, width);
        }
    }

    useLayoutEffect(() => {
        if(onLoadCallback && iconRef.current){
            if (iconProps.icon?.includes('fa fa-')) {
                sendOnLoadCallback(id, props.preferredSize, iconRef.current, onLoadCallback)
            }
        }
    },[onLoadCallback, id, iconProps.icon, props.preferredSize]);

    const iconOrImage = (icon:string|undefined) => {
        if (icon) {
            if(icon.includes('fa fa-'))
                return <i className={icon}/>
            else
                return <img
                    alt="icon"
                    src={context.server.RESOURCE_URL + iconProps.icon}
                    onLoad={iconLoaded}/>
        }
    }

    return (
        <span ref={iconRef} className={"jvxIcon" + (props.name === "Validator" ? " jvxValidator" : "")} style={layoutValue.get(props.id)}>
            {iconOrImage(iconProps.icon)}
        </span>
    )
}
export default UIIcon