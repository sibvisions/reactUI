import React, { FC, useCallback, useEffect, useRef } from "react";
import { Tooltip } from "primereact/tooltip";
import { useComponents, useMouseListener, usePopupMenu, useComponentConstants } from "../../zhooks";
import { Layout } from "../../layouts";
import { parsePrefSize, parseMinSize, parseMaxSize, Dimension, panelReportSize, panelGetStyle, concatClassnames, checkComponentName } from "../../util";
import BaseComponent from "../../BaseComponent";
import COMPONENT_CLASSNAMES from "../../COMPONENT_CLASSNAMES";

/** Interface for Panels */
export interface IPanel extends BaseComponent {
    layout: string,
    layoutData: string,
    backgroundImage?: string,
    "mobile.autoclose"?: boolean,
    screen_modal_?: boolean
    screen_navigationName_?:string
    screen_title_?: string,
    screen_className_?: string,
    screen_size_?: string,
    content_className_?: string,
    content_modal_?: boolean,
    content_title_?: string
}

/**
 * This component displays a panel which holds a layout where components are lay out
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIPanel: FC<IPanel> = (baseProps) => {
    /** Component constants */
    const [context, topbar, [props], layoutStyle, translation, compStyle] = useComponentConstants<IPanel>(baseProps, {visibility: 'hidden'});

    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [components, componentSizes] = useComponents(baseProps.id, props.className);

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

    /** When the panel is visible call each missing data call (useFetchMissingData) */
    useEffect(() => {
        if (layoutStyle?.visibility !== "hidden" && props.parent === undefined) {
            context.contentStore.missingDataCalls.get(props.name)?.forEach((call, key) => {
                call.apply(undefined, []);
                context.contentStore.missingDataCalls.delete(key);
            });
        }
    }, [layoutStyle?.visibility, props.parent]);

    return (
        <>
            <Tooltip target={"#" + props.name} />
            <div
                className={concatClassnames(
                    "rc-panel",
                    props.style === "tagpanel" ? "tag-panel" : ""
                )}
                ref={panelRef}
                id={checkComponentName(props.name)}
                style={props.screen_modal_ || props.content_modal_ ? {
                    height: prefSize?.height,
                    width: prefSize?.width,
                    ...(props.backgroundImage ? { '--backgroundImage': `url(${context.server.RESOURCE_URL + props.backgroundImage.split(',')[0]})` } : {})
                } : {
                    ...layoutStyle,
                    ...compStyle,
                    ...(props.backgroundImage ? { '--backgroundImage': `url(${context.server.RESOURCE_URL + props.backgroundImage.split(',')[0]})` } : {})
                }}
                data-pr-tooltip={props.toolTipText}
                data-pr-position="left"
                {...usePopupMenu(props)} >
                <Layout
                    id={id}
                    className={props.className}
                    layoutData={props.layoutData}
                    layout={props.layout}
                    preferredSize={parsePrefSize(props.preferredSize)}
                    minimumSize={parseMinSize(props.minimumSize)}
                    maximumSize={parseMaxSize(props.maximumSize)}
                    popupSize={parsePrefSize(props.screen_size_)}
                    reportSize={reportSize}
                    compSizes={componentSizes}
                    components={components}
                    style={panelGetStyle(
                        false,
                        layoutStyle,
                        prefSize,
                        props.screen_modal_ || props.content_modal_,
                        props.screen_size_
                    )}
                    isToolBar={props.className === COMPONENT_CLASSNAMES.TOOLBAR}
                    parent={props.parent} />
            </div>
        </>
    )
}
export default UIPanel