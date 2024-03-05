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

import React, { CSSProperties, FC, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { Tooltip } from "primereact/tooltip";
import IBaseComponent from "../../../util/types/IBaseComponent";
import COMPONENT_CLASSNAMES from "../../COMPONENT_CLASSNAMES";
import Dimension from "../../../util/types/Dimension";
import LoadCallBack from "../../../util/types/LoadCallBack";
import { sendOnLoadCallback } from "../../../util/server-util/SendOnLoadCallback";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../../util/component-util/SizeUtil";
import useComponents from "../../../hooks/components-hooks/useComponents";
import { concatClassnames } from "../../../util/string-util/ConcatClassnames";
import usePopupMenu from "../../../hooks/data-hooks/usePopupMenu";
import Layout from "../../layouts/Layout";
import { IComponentConstants } from "../../BaseComponent";

/** Interface for Panels */
export interface IPanel extends IBaseComponent {
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
    content_title_?: string,
    screen_resizable_?: boolean,
    screen_iconifiable_?: boolean,
    screen_maximizable_?: boolean,
    screen_closable_?: boolean,
    content_resizable_?: boolean,
    content_iconifiable_?: boolean,
    content_maximizable_?: boolean,
    content_closable_?: boolean
}

/**
 * Reports the size of a panel to its parent. Handles special cases of the pansels
 * @param id - the id of the panel
 * @param type - the type of the panel "P" = Panel, "G" = GroupPanel, "S" = ScrollPanel
 * @param calcPref - the calcualted preferred-size
 * @param className - the classname of the component
 * @param calcMin - the calculated minimum-size
 * @param propPref - the preferred-size received from the server
 * @param propMin - the minimum-size received from the server
 * @param propMax - the maximum-size received from the server
 * @param onLoadCallback - the function to report the size to the parent
 * @param minusHeight - True, if the panel has to adjust its height to the scrollbar (only for ScrollPanels)
 * @param minusWidth - True, if the panel has to adjust its width to the scrollbar (only for ScrollPanels)
 * @param scrollSize - The layout size of a ScrollPanel
 * @param scrollCallback - The callback for a ScrollPanel
 */
export function panelReportSize(id: string,
    type: "P" | "S" | "G",
    calcPref: Dimension,
    className: string,
    styleClassNames: string[],
    calcMin?: Dimension,
    propPref?: string,
    propMin?: string,
    propMax?: string,
    onLoadCallback?: LoadCallBack,
    minusHeight?: boolean,
    minusWidth?: boolean) {
    if (onLoadCallback) {
        const adjustedSize: Dimension = { height: calcPref.height, width: calcPref.width }
        // GroupPanel needs an extra 28px for the header
        if (type === "G") {
            adjustedSize.height += 28
        }
        else if (type === "S") {
            // Scrollpanel extra 17px for scrollbars
            adjustedSize.height += minusHeight ? 17 : 0
            adjustedSize.width += minusWidth ? 17 : 0
        }

        // Add border width
        if (styleClassNames.includes("f_standard_border")) {
            const borderWidth = parseInt(window.getComputedStyle(document.documentElement).getPropertyValue("--input-border-width"));
            if (!isNaN(borderWidth)) {
                adjustedSize.height += borderWidth * 2;
                adjustedSize.width += borderWidth * 2;
            }
        }
        sendOnLoadCallback(
            id,
            className,
            propPref ? parsePrefSize(propPref) : adjustedSize,
            parseMaxSize(propMax),
            propMin ? parseMinSize(propMin) : calcMin,
            undefined,
            onLoadCallback
        )
    }
}

/**
 * Returns the style of the panel/layout.
 * @param group - True, if the panel is a group-panel
 * @param layoutStyle - The calculated layout-style if available
 * @param prefSize - the preferred-size sent by the server
 * @param modal - True, if the screen is a popup
 * @param modalSize - The size of the popup sent by the server
 * @returns the style of the panel/layout.
 */
export function panelGetStyle(group: boolean, layoutStyle?: CSSProperties, prefSize?: Dimension, modal?: boolean, modalSize?: string, version?: "partial"|"full") {
    let s: CSSProperties = { ...layoutStyle };

    // Set top and left to undefined, some components could be missing if this would not be done
    if (Object.getOwnPropertyDescriptor(s, 'top')?.configurable && Object.getOwnPropertyDescriptor(s, 'left')?.configurable) {
        s.top = undefined;
        s.left = undefined;
    }

    /** Tell layout that because of the group-panel header it is ~28px smaller */
    if (group) {
        if (s.height !== undefined) {
            (s.height as number) -= 28;
        }
    }
    return s
}

/**
 * This component displays a panel which holds a layout where components are lay out
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIPanel: FC<IPanel & IComponentConstants> = (props) => {
    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [, components, componentSizes] = useComponents(props.id, props.className);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = props;

    /** Preferred size of panel */
    const prefSize = parsePrefSize(props.preferredSize);

    /** True, if this is a toolbar and it is the last toolbar of its parent */
    const isLastToolBar = useMemo(() => {
        if (id.includes("TB") && props.parent) {
            const tbChildren = [...props.context.contentStore.getChildren(props.parent + "-tbMain", COMPONENT_CLASSNAMES.TOOLBARHELPERMAIN)];
            if (tbChildren.length) {
                return tbChildren.findIndex(entry => entry[1].id === id) === tbChildren.length - 1 ? true : false;
            }
        }
        return false;
    }, [id, props.parent]);

    /** True if this panel is a toolbar */
    const isToolBar = useMemo(() => props.className === COMPONENT_CLASSNAMES.TOOLBAR, [props.className]);

    /** True, if the overflow is hidden. */
    const isOverflowHidden = useMemo(() => {
        let isHidden = true;
        if (props.parent) {
            let parentComp = props.context.contentStore.getComponentById(props.parent);
            if (parentComp) {
                if (parentComp.className === COMPONENT_CLASSNAMES.TABSETPANEL || parentComp.className === COMPONENT_CLASSNAMES.SPLITPANEL) {
                    return true;
                }

                if (props.layout && props.layout.startsWith("FlowLayout") && props.layout.split(",")[11] === 'false') {
                    return true;
                }
                while (parentComp) {
                    if (parentComp.className === COMPONENT_CLASSNAMES.SCROLLPANEL) {
                        isHidden = false;
                        break;
                    }
                    parentComp = props.context.contentStore.getComponentById(parentComp.parent);
                }
            }
        }
        return isHidden;
    }, [props.parent])

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
            props.styleClassNames,
            minSize, 
            props.preferredSize, 
            props.minimumSize, 
            props.maximumSize, 
            onLoadCallback
        )
    }, [onLoadCallback]);

    /** Returns the className based on the position of the toolbar, for border positions */
    const getToolBarClassName = useCallback(() => {
        if (isToolBar && !isLastToolBar) {
            switch (parseInt(props.layout.split(",")[7])) {
                case 0:
                    return "rc-toolbar-border-right";
                case 1:
                    return "rc-toolbar-border-bottom";
            }
        }
        return ""
    }, [props.layout, isToolBar, isLastToolBar]);

    return (
        <>
            <Tooltip target={"#" + props.name} />
            <div
                className={concatClassnames(
                    "rc-panel",
                    getToolBarClassName(),
                    isOverflowHidden ? "panel-hide-overflow" : "",
                    props.styleClassNames
                )}
                ref={props.forwardedRef}
                id={props.name}
                style={props.screen_modal_ || props.content_modal_ ? {
                    ...props.layoutStyle,
                    height: undefined,
                    width: undefined,
                    // height: prefSize?.height,
                    // width: prefSize?.width,
                    ...(props.backgroundImage ? { '--backgroundImage': `url(${props.context.server.RESOURCE_URL + props.backgroundImage.split(',')[0]})` } : {})
                } : {
                    ...props.layoutStyle,
                    ...props.compStyle,
                    ...(props.backgroundImage ? { '--backgroundImage': `url(${props.context.server.RESOURCE_URL + props.backgroundImage.split(',')[0]})` } : {})
                }}
                data-pr-tooltip={props.toolTipText}
                data-pr-position="left"
                {...usePopupMenu(props)} >
                <Layout
                    id={id}
                    name={props.name}
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
                        props.layoutStyle,
                        prefSize,
                        props.screen_modal_ || props.content_modal_,
                        props.screen_size_,
                        props.context.transferType
                    )}
                    isToolBar={isToolBar}
                    parent={props.parent}
                    hasBorder={props.styleClassNames.includes("f_standard_border")} />
            </div>
        </>
    )
}
export default UIPanel