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

import React, { CSSProperties, FC, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createCloseFrameRequest } from "../../factories/RequestFactory";
import BaseComponent from "../../util/types/BaseComponent";
import COMPONENT_CLASSNAMES from "../COMPONENT_CLASSNAMES";
import UIMenuBar from "../menubar/UIMenuBar";
import UIToolbar from "../toolbar/UIToolbar";
import { showTopBar } from "../topbar/TopBar";
import { isFAIcon } from "../../hooks/event-hooks/useButtonMouseImages";
import { IInternalFrame } from "./UIInternalFrame";
import { panelGetStyle } from "../panels/panel/UIPanel";
import ContentStoreFull from "../../contentstore/ContentStoreFull";
import { ComponentSizes } from "../../hooks/components-hooks/useComponents";
import Dimension from "../../util/types/Dimension";
import { parseIconData } from "../comp-props/ComponentProperties";
import { concatClassnames } from "../../util/string-util/ConcatClassnames";
import REQUEST_KEYWORDS from "../../request/REQUEST_KEYWORDS";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../util/component-util/SizeUtil";
import Layout from "../layouts/Layout";
import { appContext } from "../../contexts/AppProvider";

// Interface for Frames
export interface IFrame extends IInternalFrame {
    frameStyle?: CSSProperties,
    internal?: boolean
    sizeCallback?:Function,
    iconImage?:string,
    children?: BaseComponent[],
    components?: any,
    compSizes?: Map<string, ComponentSizes>
}

/** This component renders a frame which can contain a menubar, toolbars and content sent by the server (workscreen, content, launcher etc.) */
const UIFrame: FC<IFrame> = (props) => {
    /** Returns utility variables */
    const context = useContext(appContext);

    /** Casts the contentStore to contentstore-full because the UIFrame is only used in Full transferType */
    const castedContentStore = context.contentStore as ContentStoreFull

    /** The menubar-properties of the frame or undefined if there is no menubar */
    const menuBarProps = useMemo(() => castedContentStore.getMenuBar(props.id), [props.components]);

    /** True, if the frame has one or more toolbars */
    const hasToolBars = useMemo(() => castedContentStore.hasToolBars(props.id), [props.components]);

    /** The size of the menubar */
    const [menuBarSize, setMenuBarSize] = useState<Dimension>({ width: 0, height: 0 });

    /** The size of the toolbar */
    const [toolBarSize, setToolBarSize] = useState<Dimension>({ width: 0, height: 0 });

    useEffect(() => {
        if (!menuBarProps) {
            setMenuBarSize({ width: 0, height: 0 })
        }
    }, [menuBarProps]);

    useEffect(() => {
        if (!hasToolBars) {
            setToolBarSize({ width: 0, height: 0 })
        }
    }, [hasToolBars]);

    /** A callback to set the menubar-size */
    const menuBarSizeCallback = useCallback((size:Dimension) => setMenuBarSize(size), []);

    /** A callback to set the toolbar-size */
    const toolBarSizeCallback = useCallback((size:Dimension) => {
        if (toolBarSize.height !== size.height || toolBarSize.width !== size.width) {
            setToolBarSize(size)
        }
    }, [toolBarSize]);

    /** The icon properties for the frame icon */
    const iconProps = useMemo(() => parseIconData(undefined, props.iconImage), [props.iconImage]);

    /** The frame style minus the menubar-size and toolbar-size */
    const adjustedStyle = useMemo(() => {
        const styleCopy:CSSProperties = {...props.frameStyle};
        if (props.frameStyle) {
            styleCopy.height = (props.frameStyle.height as number) - menuBarSize.height - toolBarSize.height;
        }

        return styleCopy;
    }, [menuBarSize, toolBarSize, props.frameStyle]);

    return (
        <div id={props.id + "-frame"} style={{ height: "100%", width: "100%", visibility: props.compSizes ? undefined : "hidden" }}>
            {props.internal &&
                <div className="rc-frame-header">
                    {props.iconImage !== undefined &&
                        (isFAIcon(iconProps.icon)
                            ?
                            <i className={concatClassnames(iconProps.icon, "rc-frame-header-icon")} style={{ fontSize: iconProps.size?.height, color: iconProps.color }} />
                            :
                            <img
                                src={context.server.RESOURCE_URL + iconProps.icon}
                                className="rc-frame-header-icon"
                                style={{
                                    height: iconProps.size?.height,
                                    minHeight: iconProps.size?.height,
                                    width: iconProps.size?.width,
                                    minWidth: iconProps.size?.width
                                }} />
                        )
                    }
                    <span className="rc-frame-header-title">{props.title}</span>
                    {props.closable !== false && <button
                        className="rc-frame-header-close-button pi pi-times"
                        onClick={() => {
                            const closeReq = createCloseFrameRequest();
                            closeReq.componentId = props.name;
                            showTopBar(context.server.sendRequest(closeReq, REQUEST_KEYWORDS.CLOSE_FRAME), context.server.topbar);
                        }}
                    />}
                </div>
            }
            <div
                className={concatClassnames(
                    "rc-frame-menu",
                    props.className === COMPONENT_CLASSNAMES.MOBILELAUNCHER ? "mobile-launcher-menu" : ""
                )}
                style={{ display: !menuBarProps && !hasToolBars ? "none" : undefined }} >
                {menuBarProps && <UIMenuBar {...menuBarProps} sizeCallback={menuBarSizeCallback} currentSize={menuBarSize} />}
                {hasToolBars && <UIToolbar id={props.id + "-frame-toolbar"} sizeCallback={toolBarSizeCallback} />}
            </div>
            <div className={props.internal ? "rc-frame-window-content" : "rc-frame-content"}>
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
                    components={props.components}
                    style={panelGetStyle(false, adjustedStyle)}
                    reportSize={props.sizeCallback ? props.sizeCallback : () => { }}
                    parent={props.parent} />
            </div>
        </div>
    )
}
export default UIFrame