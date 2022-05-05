import React, { FC, useRef } from "react";
import { useComponents, useMouseListener, useComponentConstants } from "../../../hooks";
import { Layout } from "../../layouts";
import { parsePrefSize, parseMinSize, parseMaxSize, checkComponentName, concatClassnames } from "../../../util";
import BaseComponent from "../../../util/types/BaseComponent";
import { panelGetStyle } from "../panel/UIPanel";

export interface IDesktopPanel extends BaseComponent {
    navigationKeysEnabled?: boolean,
    tabMode?: boolean,
    layout: string,
    layoutData: string,
}

/**
 * This component generally is displayed when no other screen is opened, it is also rendered on login if available.
 * @param baseProps - the base propertie sent by the server
 */
const UIDesktopPanel: FC<IDesktopPanel> = (baseProps) => {
    /** Component constants */
    const [,, [props], layoutStyle] = useComponentConstants<IDesktopPanel>(baseProps, {visibility: 'hidden'});

    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [, components, componentSizes] = useComponents(baseProps.id, props.className);

    /** Reference for the DesktopPanel element */
    const panelRef = useRef<any>(null);

    /** Hook for MouseListener */
    useMouseListener(props.name, panelRef.current ? panelRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    return (
        <div
            className={concatClassnames("rc-desktop-panel", props.style)}
            ref={panelRef}
            id={checkComponentName(props.name)}
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