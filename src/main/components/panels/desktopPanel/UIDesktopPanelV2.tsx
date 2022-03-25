import React, { createContext, CSSProperties, FC, useCallback, useContext, useMemo, useRef, useState } from "react";
import { useComponents, useMouseListener, useComponentConstants, ComponentSizes, useConstants } from "../../zhooks";
import { Layout } from "../../layouts";
import { parsePrefSize, parseMinSize, parseMaxSize, panelGetStyle, checkComponentName, Dimension, panelReportSize } from "../../util";
import BaseComponent from "../../BaseComponent";
import COMPONENT_CLASSNAMES from "../../COMPONENT_CLASSNAMES";
import TabsetPanelImpl from "../tabsetpanel/TabsetPanelImpl";
import { createCloseFrameRequest } from "../../../factories/RequestFactory";
import { showTopBar } from "../../topbar/TopBar";
import { REQUEST_KEYWORDS } from "../../../request";

export interface IDesktopPanel extends BaseComponent {
    navigationKeysEnabled?: boolean,
    tabMode?: boolean,
    layout: string,
    layoutData: string,
}

interface IOpenedFrameContext {
    openFrames: string[],
    openFramesCallback: Function,
    tabMode: boolean
}

export const OpenFrameContext = createContext<IOpenedFrameContext>({ openFrames: [], openFramesCallback: () => {}, tabMode: false });

interface IDesktopTabPanel extends IDesktopPanel {
    components: React.ReactElement<any, string | React.JSXElementConstructor<any>>[]
    compSizes: Map<string, ComponentSizes> | undefined
    compStyle: CSSProperties
    layoutStyle: CSSProperties|undefined
}

const DesktopTabPanel: FC<IDesktopTabPanel> = (props) => {
    /** Returns utility variables */
    const [context, topbar] = useConstants()

    /** Handles the state of the current selected index */
    const [selectedIndex, setSelectedIndex] = useState<number>(0);

    return (
        <TabsetPanelImpl 
            {...props} 
            components={props.components}
            compSizes={props.compSizes}
            compStyle={props.compStyle}
            layoutStyle={props.layoutStyle}
            selectedIndex={selectedIndex}
            onTabChange={(i:number) => setSelectedIndex(i)}
            onTabClose={(i:number) => {
                const closeReq = createCloseFrameRequest();
                closeReq.componentId = props.components[i].props.name;
                showTopBar(context.server.sendRequest(closeReq, REQUEST_KEYWORDS.CLOSE_FRAME), topbar);
            }} />
    )
}

const UIDesktopPanelV2: FC<IDesktopPanel> = (baseProps) => {
    /** Component constants */
    const [context, topbar, [props], layoutStyle, translation, compStyle] = useComponentConstants<IDesktopPanel>(baseProps, {visibility: 'hidden'});

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

    const displayTabMode = useMemo(() => props.tabMode && children.find(child => child.className === COMPONENT_CLASSNAMES.INTERNAL_FRAME) !== undefined, [props.tabMode, children]);

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
    }, [openFrames]);

    return (
        <OpenFrameContext.Provider value={{ openFrames: openFrames, openFramesCallback: openFramesCallback, tabMode: props.tabMode === true }}>
            <div
                className="rc-desktop-panel"
                ref={panelRef}
                id={checkComponentName(props.name)}
                style={{ ...layoutStyle, backgroundColor: props.background }} >
                {displayTabMode ? 
                        <DesktopTabPanel 
                            {...props} 
                            components={components.filter(comp => comp.props.className === COMPONENT_CLASSNAMES.INTERNAL_FRAME)}
                            compSizes={componentSizes ? new Map([...componentSizes].filter(comp => context.contentStore.getComponentById(comp[0])?.className === COMPONENT_CLASSNAMES.INTERNAL_FRAME)) : undefined}
                            compStyle={compStyle}
                            layoutStyle={layoutStyle} /> 
                    : 
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
                            parent={props.parent} />}

            </div>
        </OpenFrameContext.Provider>
    )
}
export default UIDesktopPanelV2