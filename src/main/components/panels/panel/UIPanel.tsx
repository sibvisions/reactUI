/** React imports */
import React, { FC, useContext, useRef } from "react";

/** Hook imports */
import { useProperties, useComponents, useLayoutValue, useMouseListener } from "../../zhooks";

/** Other imports */
import { Layout } from "../../layouts";
import { parsePrefSize, parseMinSize, parseMaxSize, Dimension, sendOnLoadCallback } from "../../util";
import BaseComponent from "../../BaseComponent";
import { appContext } from "../../../AppProvider";

/** Interface for Panels */
export interface IPanel extends BaseComponent{
    orientation: number,
    layout: string,
    layoutData: string,
    backgroundImage?: string,
    "mobile.autoclose": boolean,
    screen_modal_?: boolean
    screen_navigationName_?:string
    screen_title_?: string,
    screen_className_?: string,
    screen_size_?: string
}

/**
 * This component displays a panel which holds a layout where components are lay out
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIPanel: FC<IPanel> = (baseProps) => {
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties(baseProps.id, baseProps);
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** get the layout style value */
    const layoutStyle = useLayoutValue(props.id, {visibility: 'hidden'});
    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [components, componentSizes] = useComponents(baseProps.id);
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;
    /** Preferred size of panel */
    const prefSize = parsePrefSize(props.preferredSize);
    const panelRef = useRef<any>(null)
    /** Hook for MouseListener */
    useMouseListener(props.name, panelRef.current ? panelRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /**
     * Returns the style of the panel/layout
     * @returns style of panel/layout
     */
    const getStyle = () => {
        let s:React.CSSProperties = {};
        /** If Panel is a popup and prefsize is set use it, not the height layoutContext provides */
        if (props.screen_modal_) {
            const screenSize = parsePrefSize(props.screen_size_);
            if (screenSize) {
                s = { ...layoutStyle, height: screenSize.height, width: screenSize.width }
            }
            else if (prefSize) {
                s = { ...layoutStyle, height: prefSize.height, width: prefSize.width };
            }
        }
        else {
            s = {...layoutStyle}
        }
            
        if (Object.getOwnPropertyDescriptor(s, 'top')?.configurable && Object.getOwnPropertyDescriptor(s, 'left')?.configurable) {
            s.top = undefined;
            s.left = undefined;
        }
        return s
    }

    /** 
     * The component reports its preferred-, minimum-, maximum and measured-size to the layout
     * In panels, this method will be passed to the layouts
     */
    const reportSize = (prefSize:Dimension, minSize?:Dimension) => {
        if (onLoadCallback) {
            sendOnLoadCallback(
                id, props.preferredSize ? parsePrefSize(props.preferredSize) : prefSize, 
                parseMaxSize(props.maximumSize), 
                props.minimumSize ? parseMinSize(props.minimumSize) : (minSize ? minSize : parseMinSize(props.minimumSize)), 
                undefined, 
                onLoadCallback
            );
        }
    }

    return (
        <div
            className="rc-panel"
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
                compSizes={componentSizes}
                components={components}
                style={getStyle()}/>
        </div>
    )
}
export default UIPanel