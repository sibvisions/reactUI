import React, {FC, useContext, useLayoutEffect, useRef, useState} from "react";
import {LayoutContext} from "../../LayoutContext";
import {jvxContext} from "../../jvxProvider";
import useProperties from "../zhooks/useProperties";
import {parseIconData} from "../compprops/ComponentProperties";
import BaseComponent from "../BaseComponent";

const UIIcon: FC<BaseComponent> = (baseProps) => {

    const iconRef = useRef<HTMLSpanElement>(null);
    const context = useContext(jvxContext);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<BaseComponent>(baseProps.id, baseProps);
    const iconProps = parseIconData(props, props.image)
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

        if (props.onLoadCallback) {
            props.onLoadCallback(props.id, height, width);
        }
    }

    useLayoutEffect(() => {
        if(onLoadCallback && iconRef.current){
            if (iconProps.icon?.includes('fa fa-')) {
                const size:DOMRect = iconRef.current.getBoundingClientRect();
                onLoadCallback(id, size.height, size.width);
            }
        }
    },[onLoadCallback, id]);

    const iconOrImage = (icon:string|undefined) => {
        if (icon) {
            if(icon.includes('fa fa-'))
                return <i className={icon}/>
            else
                return <img
                    alt="icon"
                    src={'http://localhost:8080/JVx.mobile/services/mobile/resource/demo' + iconProps.icon}
                    onLoad={iconLoaded}/>
        }
    }

    return (
        <span ref={iconRef} style={layoutValue.get(props.id) ? layoutValue.get(props.id) : {position: "absolute"}}>
            {iconOrImage(iconProps.icon)}
        </span>
    )
}
export default UIIcon