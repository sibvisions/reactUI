import React, { FC, useRef } from "react";
import BaseComponent from "../BaseComponent";
import UIFrame from "../frame/UIFrame";
import { useComponentConstants, useMouseListener } from "../zhooks";

interface IMobileLauncher extends BaseComponent {
    layout:string,
    layoutData:string,
    menuBar:string,
    title:string
}

const UIMobileLauncher: FC<IMobileLauncher> = (baseProps) => {
    /** Component constants */
    const [context, topbar, [props], layoutStyle, translation, compStyle] = useComponentConstants<IMobileLauncher>(baseProps, {visibility: 'hidden'});

    /** Reference for the panel element */
    const panelRef = useRef<any>(null);

    /** Hook for MouseListener */
    useMouseListener(props.name, panelRef.current ? panelRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    return (
        <div id={props.name} ref={panelRef} className="rc-mobile-launcher" style={{...layoutStyle, ...compStyle}}>
            <UIFrame {...props} layoutStyle={layoutStyle} />
        </div>

    )
}
export default UIMobileLauncher