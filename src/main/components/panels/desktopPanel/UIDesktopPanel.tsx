import React, { createContext, FC, useCallback, useRef, useState } from "react";
import { useComponents, useMouseListener, useComponentConstants } from "../../zhooks";
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

interface IOpenedFrameContext {
    openFrames: string[],
    openFramesCallback: Function
}

export const OpenFrameContext = createContext<IOpenedFrameContext>({ openFrames: [], openFramesCallback: () => {} });

const UIDesktopPanel: FC<IDesktopPanel> = (baseProps) => {
    /** Component constants */
    const [context, topbar, [props], layoutStyle] = useComponentConstants<IDesktopPanel>(baseProps, {visibility: 'hidden'});

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [children, components, componentSizes] = useComponents(baseProps.id, props.className);

    const [openFrames, setOpenedFrames] = useState<string[]>(() => {
        const foundIF = children.filter(child => child.className === COMPONENT_CLASSNAMES.INTERNAL_FRAME).map(frame => frame.name);
        if (foundIF) {
            return foundIF
        }
        else {
            return [""];
        }
    });

    /** Reference for the DesktopPanel element */
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

    /**
     * Either adds a frame-name at the start or the end of openFrames depending on the toFront parameter
     * @param name - the name of the InternalFrame
     * @param toFront - true, if the frame should be added to the front, false if added to the back
     */
    const openFramesCallback = useCallback((name:string, toFront: boolean) => {
        const arrCopy = [...openFrames];
        const foundIndex = arrCopy.findIndex(openName => openName === name);
        if (foundIndex >= 0) {
            arrCopy.splice(foundIndex, 1);
        }
        toFront ? arrCopy.unshift(name) : arrCopy.push(name);
        setOpenedFrames(arrCopy);
    }, [openFrames])

    return (
        <OpenFrameContext.Provider value={{ openFrames: openFrames, openFramesCallback: openFramesCallback }}>
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
        </OpenFrameContext.Provider>
    )
}
export default UIDesktopPanel