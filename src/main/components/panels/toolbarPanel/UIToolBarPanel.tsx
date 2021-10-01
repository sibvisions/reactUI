/** React imports */
import React, { FC, ReactElement, useCallback, useContext, useMemo, useRef, useState } from "react";

/** 3rd party imports */
import { Toolbar } from 'primereact/toolbar';

/** Hook imports */
import { useProperties, useComponents, useLayoutValue, useMouseListener, ComponentSizes } from "../../zhooks";

/** Other imports */
import { Layout } from "../../layouts";
import { parsePrefSize, parseMinSize, parseMaxSize, Dimension, sendOnLoadCallback, panelReportSize } from "../../util";
import { appContext } from "../../../AppProvider";
import { IPanel } from "..";

/** Interface for ToolbarPanels */
export interface IToolBarPanel extends IPanel {
    toolBarArea:0|1|2|3;
}

const UIToolBarPanel: FC<IToolBarPanel> = (baseProps) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties(baseProps.id, baseProps);

    /** get the layout style value */
    const layoutStyle = useLayoutValue(props.id, {visibility: 'hidden'});

    /** Children of this panel */
    const children = useMemo(() => new Map([...context.contentStore.getChildren(props.id)].filter(entry => entry[0].includes("-tb"))), [props.id]);

    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [components, componentSizes] = useComponents(baseProps.id, children);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** Preferred size of panel */
    const prefSize = parsePrefSize(props.preferredSize);

    const panelRef = useRef<any>(null);

    const toolBarRef = useRef<any>(null);

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
            //className="rc-panel"
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
                layoutData={""}
                layout={props.layout}
                preferredSize={parsePrefSize(props.preferredSize)}
                minimumSize={parseMinSize(props.minimumSize)}
                maximumSize={parseMaxSize(props.maximumSize)}
                popupSize={parsePrefSize(props.screen_size_)}
                reportSize={reportSize}
                compSizes={componentSizes}
                components={components.filter(comp => comp.props.id.includes(id + '-'))}
                style={getStyle()}
                children={children}
                parent={props.parent}
            />
        </div>
    )
}
export default UIToolBarPanel;