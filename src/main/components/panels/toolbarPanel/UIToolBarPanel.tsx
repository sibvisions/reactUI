/** React imports */
import React, { FC, useCallback, useEffect, useRef } from "react";

/** 3rd Party imports */
import { Tooltip } from "primereact/tooltip";

/** Hook imports */
import { useComponents, useMouseListener, usePopupMenu, useComponentConstants } from "../../zhooks";

/** Other imports */
import { Layout } from "../../layouts";
import { parsePrefSize, parseMinSize, parseMaxSize, Dimension, panelReportSize, panelGetStyle, checkComponentName } from "../../util";
import { IPanel } from "..";

/** Interface for ToolbarPanels */
export interface IToolBarPanel extends IPanel {
    toolBarArea:0|1|2|3;
    toolBarVisible?:boolean
}

const UIToolBarPanel: FC<IToolBarPanel> = (baseProps) => {
    /** Component constants */
    const [context, topbar, [props], layoutStyle] = useComponentConstants<IToolBarPanel>(baseProps, {visibility: 'hidden'});

    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [children, components, componentSizes] = useComponents(baseProps.id, props.className);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** Preferred size of panel */
    const prefSize = parsePrefSize(props.preferredSize);

    const panelRef = useRef<any>(null);

    /** Hook for MouseListener */
    useMouseListener(props.name, panelRef.current ? panelRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** 
     * The component reports its preferred-, minimum-, maximum and measured-size to the layout
     * In panels, this method will be passed to the layouts
     */
     const reportSize = useCallback((prefSize:Dimension, minSize?:Dimension) => {
        panelReportSize(
            id, 
            "P", 
            prefSize,
            props.className,
            minSize, 
            props.preferredSize, 
            props.minimumSize, 
            props.maximumSize, 
            onLoadCallback
        )
    }, [onLoadCallback])

    return (
        <>
            <Tooltip target={"#" + props.name} />
            <div
                ref={panelRef}
                id={checkComponentName(props.name)}
                style={props.screen_modal_ || props.content_modal_ ? {
                    height: prefSize?.height,
                    width: prefSize?.width,
                    ...(props.backgroundImage ? { '--backgroundImage': `url(${context.server.RESOURCE_URL + props.backgroundImage.split(',')[0]})` } : {})
                } : {
                    ...layoutStyle,
                    backgroundColor: props.background,
                    ...(props.backgroundImage ? { '--backgroundImage': `url(${context.server.RESOURCE_URL + props.backgroundImage.split(',')[0]})` } : {})
                }}
                data-pr-tooltip={props.toolTipText}
                data-pr-position="left"
                {...usePopupMenu(props)} >
                <Layout
                    id={id}
                    className={props.className}
                    layoutData={""}
                    layout={props.layout}
                    preferredSize={parsePrefSize(props.preferredSize)}
                    minimumSize={parseMinSize(props.minimumSize)}
                    maximumSize={parseMaxSize(props.maximumSize)}
                    popupSize={parsePrefSize(props.screen_size_)}
                    reportSize={reportSize}
                    compSizes={componentSizes}
                    components={components.filter(comp => comp.props.id.includes(id + '-'))}
                    style={panelGetStyle(
                        false,
                        layoutStyle,
                        prefSize,
                        props.screen_modal_ || props.content_modal_,
                        props.screen_size_
                    )}
                    parent={props.parent}
                />
            </div>
        </>
    )
}
export default UIToolBarPanel;