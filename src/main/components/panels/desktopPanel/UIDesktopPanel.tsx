/** React imports */
import React, { createContext, FC, useCallback, useRef, useState } from "react";

/** Hook imports */
import { useComponents, useMouseListener, useComponentConstants } from "../../zhooks";

/** Other imports */
import { Layout } from "../../layouts";
import { parsePrefSize, parseMinSize, parseMaxSize, panelGetStyle, checkComponentName, Dimension, panelReportSize } from "../../util";
import BaseComponent from "../../BaseComponent";
import COMPONENT_CLASSNAMES from "../../COMPONENT_CLASSNAMES";

export interface IDesktopPanel extends BaseComponent {
    navigationKeysEnabled?: boolean,
    tabMode?: boolean,
    layout: string,
    layoutData: string,
}

interface IFocusFrameContext {
    name: string,
    callback: Function
}

export const FocusFrameContext = createContext<IFocusFrameContext>({ name: "", callback: () => {} });

const UIDesktopPanel: FC<IDesktopPanel> = (baseProps) => {
    /** Component constants */
    const [context, topbar, [props], layoutStyle] = useComponentConstants<IDesktopPanel>(baseProps, {visibility: 'hidden'});

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [children, components, componentSizes] = useComponents(baseProps.id, props.className);

    const [focusedFrame, setFocusedFrame] = useState<string>(children.find(child => child.className === COMPONENT_CLASSNAMES.INTERNAL_FRAME)?.name || "");

    const panelRef = useRef<any>(null);
    
    /** Hook for MouseListener */
    useMouseListener(props.name, panelRef.current ? panelRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** 
     * The component reports its preferred-, minimum-, maximum and measured-size to the layout
     * In panels, this method will be passed to the layouts
     */
    const reportSize = useCallback((prefSize: Dimension, minSize?: Dimension) => {
        panelReportSize(
            id,
            "P",
            prefSize,
            props.className,
            minSize,
            props.preferredSize,
            props.minimumSize,
            props.maximumSize,
            props.onLoadCallback
        )
    }, [onLoadCallback]);

    const focusedFrameCallback = (name:string) => {
        setFocusedFrame(name);
    }

    return (
        <FocusFrameContext.Provider value={{ name: focusedFrame, callback: focusedFrameCallback }}>
            <div
                className="rc-desktop-panel"
                ref={panelRef}
                id={checkComponentName(props.name)}
                style={{ ...layoutStyle, backgroundColor: props.background }} >
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
                    reportSize={reportSize}
                    panelType="DesktopPanel"
                    parent={props.parent} />
            </div>
        </FocusFrameContext.Provider>
    )
}
export default UIDesktopPanel