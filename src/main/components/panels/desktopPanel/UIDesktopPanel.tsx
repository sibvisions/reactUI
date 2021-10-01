/** React imports */
import React, { FC, useContext, useMemo, useRef } from "react";

/** Hook imports */
import { useProperties, useComponents, useMouseListener, useLayoutValue } from "../../zhooks";

/** Other imports */
import { Layout } from "../../layouts";
import { parsePrefSize, parseMinSize, parseMaxSize } from "../../util";
import BaseComponent from "../../BaseComponent";
import { appContext } from "../../../AppProvider";

export interface IDesktopPanel extends BaseComponent {
    navigationKeysEnabled?: boolean,
    tabMode?: boolean,
    layout: string,
    layoutData: string,
}

const UIDesktopPanel: FC<IDesktopPanel> = (baseProps) => {
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties(baseProps.id, baseProps);

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** get the layout style value */
    const layoutStyle = useLayoutValue(props.id, {visibility: 'hidden'});

    /** Children of this panel */
    const children = useMemo(() => context.contentStore.getChildren(props.id), [props.id]);

    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [components, componentSizes] = useComponents(baseProps.id, children);

    const panelRef = useRef<any>(null);
    /** Hook for MouseListener */
    useMouseListener(props.name, panelRef.current ? panelRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    return (
        <div
            className="rc-desktop-panel"
            ref={panelRef}
            id={props.name}
            style={{...layoutStyle, backgroundColor: props.background}} >
            <Layout
                id={props.id}
                layoutData={props.layoutData}
                layout={props.layout}
                preferredSize={parsePrefSize(props.preferredSize)}
                minimumSize={parseMinSize(props.minimumSize)}
                maximumSize={parseMaxSize(props.maximumSize)}
                compSizes={componentSizes}
                components={components}
                style={{...layoutStyle}} 
                reportSize={() => {}}
                panelType="DesktopPanel"
                children={children}
                parent={props.parent} />
        </div>
    )
}
export default UIDesktopPanel