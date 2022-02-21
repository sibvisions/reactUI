import React, { FC, useMemo, useRef } from "react";
import BaseComponent from "../BaseComponent";
import COMPONENT_CLASSNAMES_V2 from "../COMPONENT_CLASSNAMES_V2";
import { Layout } from "../layouts";
import { panelGetStyle, parseMaxSize, parseMinSize, parsePrefSize } from "../util";
import { useComponentConstants, useComponents, useMenuItems, useMouseListener } from "../zhooks";

interface IMobileLauncher extends BaseComponent {
    layout:string,
    layoutData:string,
    menuBar:string,
    title:string
}

const UIMobileLauncher: FC<IMobileLauncher> = (baseProps) => {
    /** Component constants */
    const [context, topbar, [props], layoutStyle, translation, compStyle] = useComponentConstants<IMobileLauncher>(baseProps, {visibility: 'hidden'});

    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [components, componentSizes] = useComponents(baseProps.id, props.className);
    
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** Reference for the panel element */
    const panelRef = useRef<any>(null);

    const children = useMemo(() => context.contentStore.getChildren(id), [components]);

    console.log(children)

    const menuItems = useMenuItems(Array.from(children.values()).find(child => child.className === COMPONENT_CLASSNAMES_V2.MENUBAR)?.id);

    /** Hook for MouseListener */
    useMouseListener(props.name, panelRef.current ? panelRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    return (
        <div id={props.name} ref={panelRef} className="rc-mobile-launcher" style={{...layoutStyle, ...compStyle}}>
            <div>test</div>
            <Layout
                id={props.id}
                className={props.className}
                layoutData={props.layoutData}
                layout={props.layout}
                preferredSize={parsePrefSize(props.preferredSize)}
                minimumSize={parseMinSize(props.minimumSize)}
                maximumSize={parseMaxSize(props.maximumSize)}
                compSizes={componentSizes}
                components={components}
                style={panelGetStyle(false, layoutStyle)}
                reportSize={() => {}}
                panelType="MobileLauncher"
                parent={props.parent} />
        </div>

    )
}
export default UIMobileLauncher