import React, { FC, useRef } from "react";
import UIFrame from "../frame/UIFrame";
import { IPanel } from "../panels";
import { useComponentConstants, useComponents, useMouseListener } from "../../hooks";

export interface IWindow extends IPanel {
    title:string
    layout:string,
    layoutData:string,
    menuBar:string,
    iconImage?: string
    modal: boolean
}

const UIMobileLauncher: FC<IWindow> = (baseProps) => {
    /** Component constants */
    const [context, topbar, [props], layoutStyle, translation, compStyle] = useComponentConstants<IWindow>(baseProps, {visibility: 'hidden'});

    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [children, components, componentSizes] = useComponents(props.id, props.className);

    /** Reference for the panel element */
    const panelRef = useRef<any>(null);

    /** Hook for MouseListener */
    useMouseListener(props.name, panelRef.current ? panelRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    return (
        <div id={props.name} ref={panelRef} className="rc-mobile-launcher" style={{...layoutStyle, ...compStyle}}>
            <UIFrame 
                {...props} 
                frameStyle={layoutStyle} 
                children={children} 
                components={components.filter(comp => comp.props["~additional"] !== true)} 
                compSizes={componentSizes ? new Map([...componentSizes].filter(comp => context.contentStore.getComponentById(comp[0])?.["~additional"] !== true)) : undefined} />
        </div>

    )
}
export default UIMobileLauncher