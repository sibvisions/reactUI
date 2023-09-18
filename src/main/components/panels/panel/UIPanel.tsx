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

import React, { CSSProperties, FC, useCallback, useMemo, useRef } from "react";
import { Tooltip } from "primereact/tooltip";
import BaseComponent from "../../../util/types/BaseComponent";
import COMPONENT_CLASSNAMES from "../../COMPONENT_CLASSNAMES";
import Dimension from "../../../util/types/Dimension";
import LoadCallBack from "../../../util/types/LoadCallBack";
import { sendOnLoadCallback } from "../../../util/server-util/SendOnLoadCallback";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../../util/component-util/SizeUtil";
import useComponentConstants from "../../../hooks/components-hooks/useComponentConstants";
import useComponents from "../../../hooks/components-hooks/useComponents";
import useMouseListener from "../../../hooks/event-hooks/useMouseListener";
import { concatClassnames } from "../../../util/string-util/ConcatClassnames";
import usePopupMenu from "../../../hooks/data-hooks/usePopupMenu";
import Layout from "../../layouts/Layout";
import useAddLayoutStyle from "../../../hooks/style-hooks/useAddLayoutStyle";

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
        if (type === "G") {
            adjustedSize.height += 28
        }
        else if (type === "S") {
            adjustedSize.height += minusHeight ? 17 : 0
            adjustedSize.width += minusWidth ? 17 : 0
        }

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
    let s: CSSProperties = {};
    /** If Panel is a popup and prefsize is set use it, not the height layoutContext provides */
    // if (modal && version !== "full") {
    //     const screenSize = parsePrefSize(modalSize);
    //     if (screenSize) {
    //         s = { ...layoutStyle, height: screenSize.height, width: screenSize.width }
    //     }
    //     else if (prefSize) {
    //         s = { ...layoutStyle, height: prefSize.height, width: prefSize.width };
    //     }
    // }
    // else {
        s = { ...layoutStyle }
    //}

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
const UIPanel: FC<IPanel> = (baseProps) => {
    /** Component constants */
    const [context,, [props], layoutStyle, compStyle, styleClassNames] = useComponentConstants<IPanel>(baseProps, {visibility: 'hidden'});

    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [, components, componentSizes] = useComponents(baseProps.id, props.className);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = props;

    /** Preferred size of panel */
    const prefSize = parsePrefSize(props.preferredSize);

    /** Reference for the panel element */
    const panelRef = useRef<any>(null);

    /** Hook for MouseListener */
    useMouseListener(props.name, panelRef.current ? panelRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    const isLastToolBar = useMemo(() => {
        if (id.includes("TB") && props.parent) {
            const tbChildren = [...context.contentStore.getChildren(props.parent + "-tbMain", COMPONENT_CLASSNAMES.TOOLBARHELPERMAIN)];
            if (tbChildren.length) {
                return tbChildren.findIndex(entry => entry[1].id === id) === tbChildren.length - 1 ? true : false;
            }
        }
        return false;
    }, [id, props.parent]);

    const isToolBar = useMemo(() => props.className === COMPONENT_CLASSNAMES.TOOLBAR, [props.className]);

    const isOverflowHidden = useMemo(() => {
        let isHidden = false;
        if (props.parent) {
            let parentComp = context.contentStore.getComponentById(props.parent);
            if (parentComp) {
                if (parentComp.className === COMPONENT_CLASSNAMES.TABSETPANEL || parentComp.className === COMPONENT_CLASSNAMES.SPLITPANEL) {
                    return true;
                }

                if (props.layout && props.layout.startsWith("FlowLayout") && props.layout.split(",")[11] === 'false') {
                    return true;
                }
                // while (parentComp) {
                //     if (parentComp.className === COMPONENT_CLASSNAMES.SCROLLPANEL) {
                //         isHidden = false;
                //         break;
                //     }
                //     parentComp = context.contentStore.getComponentById(parentComp.parent);
                // }
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
            styleClassNames,
            minSize, 
            props.preferredSize, 
            props.minimumSize, 
            props.maximumSize, 
            onLoadCallback
        )
    }, [onLoadCallback]);

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

    useAddLayoutStyle(panelRef.current, layoutStyle, onLoadCallback);

    return (
        <>
            <Tooltip target={"#" + props.name} />
            <div
                className={concatClassnames(
                    "rc-panel",
                    getToolBarClassName(),
                    isOverflowHidden ? "panel-hide-overflow" : "",
                    styleClassNames
                )}
                ref={panelRef}
                id={props.name}
                style={props.screen_modal_ || props.content_modal_ ? {
                    ...layoutStyle,
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
                        layoutStyle,
                        prefSize,
                        props.screen_modal_ || props.content_modal_,
                        props.screen_size_,
                        context.transferType
                    )}
                    isToolBar={isToolBar}
                    parent={props.parent}
                    hasBorder={styleClassNames.includes("f_standard_border")} />
            </div>
        </>
    )
}
export default UIPanel