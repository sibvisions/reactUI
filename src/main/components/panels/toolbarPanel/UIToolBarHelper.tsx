/** React imports */
import React, { FC, useContext, useMemo, useRef } from "react";

/** Hook imports */
import { useProperties, useComponents, useLayoutValue, useMouseListener } from "../../zhooks";

/** Other imports */
import { Layout } from "../../layouts";
import { parsePrefSize, parseMinSize, parseMaxSize, Dimension, sendOnLoadCallback, panelReportSize, panelGetStyle } from "../../util";
import { appContext } from "../../../AppProvider";
import { IPanel } from "..";

const UIToolBarHelper: FC<IPanel> = (baseProps) => {
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties(baseProps.id, baseProps);

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** get the layout style value */
    const layoutStyle = useLayoutValue(props.id, {visibility: 'hidden'});

    /** Children of this panel */
    const children = new Map([...context.contentStore.getChildren(props.parent as string)].filter(entry => props.id.includes("-tbMain") ? entry[1]["~additional"] : !entry[1]["~additional"] && !entry[0].includes("-tb")));

    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [components, componentSizes] = useComponents(baseProps.id, children);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** Preferred size of panel */
    const prefSize = parsePrefSize(props.preferredSize);

    /** Reference for the panel element */
    const panelRef = useRef<any>(null);

    /** Hook for MouseListener */
    useMouseListener(props.name, panelRef.current ? panelRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** 
     * The component reports its preferred-, minimum-, maximum and measured-size to the layout
     * In panels, this method will be passed to the layouts
     */
     const reportSize = (prefSize:Dimension, minSize?:Dimension) => {
        panelReportSize(
            id, 
            "P", 
            prefSize, 
            minSize, 
            props.preferredSize, 
            props.minimumSize, 
            props.maximumSize, 
            onLoadCallback
        )
    }

    return (
        <div
            className={id.includes("-tbMain") ? "rc-toolbar" : "rc-panel"}
            ref={panelRef}
            id={props.name} 
            style={props.screen_modal_ ? { 
                height: prefSize?.height, 
                width: prefSize?.width,
                ...(props.backgroundImage ? { '--backgroundImage': `url(${context.server.RESOURCE_URL + props.backgroundImage.split(',')[0]})` } : {})
            } : {
                ...layoutStyle, 
                backgroundColor: props.background,
                ...(props.backgroundImage ? { '--backgroundImage': `url(${context.server.RESOURCE_URL + props.backgroundImage.split(',')[0]})` } : {})
            }}>
            <Layout
                id={id}
                layoutData={props.layoutData}
                layout={props.layout}
                preferredSize={parsePrefSize(props.preferredSize)}
                minimumSize={parseMinSize(props.minimumSize)}
                maximumSize={parseMaxSize(props.maximumSize)}
                popupSize={parsePrefSize(props.screen_size_)}
                reportSize={reportSize}
                compSizes={componentSizes ? new Map([...componentSizes].filter((v, k) => !v[0].includes("-tb"))) : undefined}
                components={id.includes("-tbMain") ? components.filter(comp => comp.props["~additional"] && !comp.props.id.includes("-tb")) : components.filter(comp => !comp.props["~additional"] && !comp.props.id.includes("-tb"))}
                style={panelGetStyle(
                    false,
                    layoutStyle,
                    prefSize,
                    props.screen_modal_,
                    props.screen_size_
                )}
                children={children}
                parent={props.parent} />
        </div>
    )   
}
export default UIToolBarHelper