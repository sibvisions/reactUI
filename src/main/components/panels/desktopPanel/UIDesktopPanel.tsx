/** React imports */
import React, { FC, useRef } from "react";

/** Hook imports */
import { useComponents, useMouseListener, useComponentConstants } from "../../zhooks";

/** Other imports */
import { Layout } from "../../layouts";
import { parsePrefSize, parseMinSize, parseMaxSize, panelGetStyle } from "../../util";
import BaseComponent from "../../BaseComponent";

export interface IDesktopPanel extends BaseComponent {
    navigationKeysEnabled?: boolean,
    tabMode?: boolean,
    layout: string,
    layoutData: string,
}

const UIDesktopPanel: FC<IDesktopPanel> = (baseProps) => {
    /** Component constants */
    const [context, topbar, [props], layoutStyle] = useComponentConstants<IDesktopPanel>(baseProps, {visibility: 'hidden'});

    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [components, componentSizes] = useComponents(baseProps.id, props.className);

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
                panelType="DesktopPanel"
                parent={props.parent} />
        </div>
    )
}
export default UIDesktopPanel