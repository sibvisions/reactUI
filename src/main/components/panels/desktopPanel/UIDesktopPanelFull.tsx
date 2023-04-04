/* Copyright 2022 SIB Visions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import React, { createContext, CSSProperties, FC, useCallback, useMemo, useRef, useState } from "react";
import BaseComponent from "../../../util/types/BaseComponent";
import COMPONENT_CLASSNAMES from "../../COMPONENT_CLASSNAMES";
import TabsetPanelImpl from "../tabsetpanel/TabsetPanelImpl";
import { createCloseFrameRequest } from "../../../factories/RequestFactory";
import { showTopBar } from "../../topbar/TopBar";
import { panelGetStyle, panelReportSize } from "../panel/UIPanel";
import useComponents, { ComponentSizes } from "../../../hooks/components-hooks/useComponents";
import useConstants from "../../../hooks/components-hooks/useConstants";
import REQUEST_KEYWORDS from "../../../request/REQUEST_KEYWORDS";
import useComponentConstants from "../../../hooks/components-hooks/useComponentConstants";
import useMouseListener from "../../../hooks/event-hooks/useMouseListener";
import Dimension from "../../../util/types/Dimension";
import { concatClassnames } from "../../../util/string-util/ConcatClassnames";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../../util/component-util/SizeUtil";
import Layout from "../../layouts/Layout";
import { IDesktopPanel } from "./UIDesktopPanel";
import useAddLayoutStyle from "../../../hooks/style-hooks/useAddLayoutStyle";

// Interface for the opened-frame-context
interface IOpenedFrameContext {
    openFrames: string[],
    openFramesCallback: Function,
    tabMode: boolean
}

// Creates a context, which manages the open-frames, has a callback to put frames in front or back and a flag if the frames are in tabmode
export const OpenFrameContext = createContext<IOpenedFrameContext>({ openFrames: [], openFramesCallback: () => {}, tabMode: false });

// Interface for a desktop-panel in tab-mode
interface IDesktopTabPanel extends IDesktopPanel {
    components: React.ReactElement<any, string | React.JSXElementConstructor<any>>[]
    compSizes: Map<string, ComponentSizes> | undefined
    compStyle: CSSProperties
    layoutStyle: CSSProperties|undefined
}

/**
 * This component displays the desktop-panel in tab-mode if the tab-mode is active
 * @param props 
 * @returns 
 */
const DesktopTabPanel: FC<IDesktopTabPanel> = (props) => {
    /** Returns utility variables */
    const [context, topbar] = useConstants()

    /** Handles the state of the current selected index */
    const [selectedIndex, setSelectedIndex] = useState<number>(0);

    return (
        <>
            <TabsetPanelImpl 
                {...props} 
                //components={props.components}
                components={props.components.filter(comp => comp.props.modal !== true)}
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
                <Layout
                    id={props.id}
                    name={props.name}
                    className={props.className}
                    layoutData={props.layoutData}
                    layout={props.layout}
                    preferredSize={parsePrefSize(props.preferredSize)}
                    minimumSize={parseMinSize(props.minimumSize)}
                    maximumSize={parseMaxSize(props.maximumSize)}
                    compSizes={props.compSizes}
                    components={props.components.filter(comp => comp.props.modal)}
                    style={panelGetStyle(false, props.layoutStyle)}
                    reportSize={() => {}}
                    panelType="DesktopPanel"
                    parent={props.parent} />
        </>

    )
}

/**
 * In full transfertype the desktop-panel is always present "below" the screens, 
 * it is either the "core" panel of the Mobile-Launcher and always visible or 
 * "below" the tab-mode
 * @param baseProps - the base propertie sent by the server
 */
const UIDesktopPanelFull: FC<IDesktopPanel> = (baseProps) => {
    /** Component constants */
    const [context,, [props], layoutStyle, compStyle, styleClassNames] = useComponentConstants<IDesktopPanel>(baseProps, {visibility: 'hidden'});

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [children, components, componentSizes] = useComponents(baseProps.id, props.className);

    /** State of the currently opened frames */
    const [openFrames, setOpenedFrames] = useState<string[]>(() => {
        const foundIF = children.filter(child => child.className === COMPONENT_CLASSNAMES.INTERNAL_FRAME).map(frame => frame.name);
        if (foundIF) {
            return foundIF
        }
        else {
            return [""];
        }
    });

    /** State if the tab-mode should be displayed */
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
            styleClassNames,
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

    useAddLayoutStyle(panelRef.current, layoutStyle, onLoadCallback);

    return (
        <OpenFrameContext.Provider value={{ openFrames: openFrames, openFramesCallback: openFramesCallback, tabMode: props.tabMode === true }}>
            <div
                className={concatClassnames("rc-desktop-panel", styleClassNames)}
                ref={panelRef}
                id={props.name}
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
                            name={props.name}
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
export default UIDesktopPanelFull