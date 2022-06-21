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

import React, { FC, useCallback, useContext, useLayoutEffect, useMemo, useRef } from "react";
import { appContext } from "../../../contexts/AppProvider";
import { Tooltip } from "primereact/tooltip";
import COMPONENT_CLASSNAMES from "../../COMPONENT_CLASSNAMES";
import { appVersion } from "../../../AppSettings";
import { IPanel, panelGetStyle, panelReportSize } from "../panel/UIPanel";
import useLayoutValue from "../../../hooks/style-hooks/useLayoutValue";
import useComponents from "../../../hooks/components-hooks/useComponents";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../../util/component-util/SizeUtil";
import useMouseListener from "../../../hooks/event-hooks/useMouseListener";
import Dimension from "../../../util/types/Dimension";
import { checkComponentName } from "../../../util/component-util/CheckComponentName";
import { concatClassnames } from "../../../util/string-util/ConcatClassnames";
import Layout from "../../layouts/Layout";
import useComponentConstants from "../../../hooks/components-hooks/useComponentConstants";

/** Interface for ToolbarHelper */
export interface IToolBarHelper extends IPanel {
    isNavTable:boolean;
    toolBarVisible?:boolean
}

const ToolBarHelper:FC<IToolBarHelper> = (props) => {
    
    const context = useContext(appContext)

    const layoutStyle = useLayoutValue(props.id, { visibility: "hidden" });

    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [, components, componentSizes] = useComponents(props.id, props.className);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = props;

    /** Preferred size of panel */
    const prefSize = parsePrefSize(props.preferredSize);

    /** Reference for the panel element */
    const panelRef = useRef<any>(null);

    /** Hook for MouseListener */
    useMouseListener(props.name, panelRef.current ? panelRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** Filters the components to only have the additional components when toolbarhelper is main, and not additional when toolbarhelper is center */
    const filteredComponents = useMemo(() => {
        return props.className === COMPONENT_CLASSNAMES.TOOLBARHELPERMAIN ? components.filter(comp => comp.props["~additional"] && !comp.props.id.includes("-tb")) : components.filter(comp => !comp.props["~additional"] && !comp.props.id.includes("-tb"))
    }, [props.className, components]);

    /**
     * Returns the className of a ToolbarPanel
     * @param constraint - the constraint of the toolbar
     * @param isNavTable - true, if the toolbar is a navtable
     */
    const getTBPosClassName = useCallback((constraint:string, isNavTable:boolean) => {
        if (isNavTable) {
            switch(constraint) {
                case "North":
                    return "navbar-north";
                case "West":
                    return "navbar-west";
                case "East":
                    return "navbar-east";
                case "South":
                    return "navbar-south";
                default:
                    return "navbar-north";
            }
        }
        else {
            switch(constraint) {
                case "North":
                    return "toolbar-north";
                case "West":
                    return "toolbar-west";
                case "East":
                    return "toolbar-east";
                case "South":
                    return "toolbar-south";
                default:
                    return "toolbar-north";
            }
        }
    }, [props.constraints])

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
    
    return (
        <>
            <Tooltip target={"#" + checkComponentName(props.name)} />
            <div
                className={concatClassnames(
                    props.className === COMPONENT_CLASSNAMES.TOOLBARHELPERMAIN ? "rc-toolbar" : "rc-panel",
                    props.className === COMPONENT_CLASSNAMES.TOOLBARHELPERMAIN ? getTBPosClassName(props.constraints, props.isNavTable) : "",
                    props.style
                )}
                ref={panelRef}
                id={checkComponentName(props.name)}
                style={props.screen_modal_ || props.content_modal_ ? {
                    height: prefSize?.height,
                    width: prefSize?.width,
                    ...(props.backgroundImage ? { '--backgroundImage': `url(${context.server.RESOURCE_URL + props.backgroundImage.split(',')[0]})` } : {}),
                    display: filteredComponents.length === 0 ? "none" : ""
                } : {
                    ...layoutStyle,
                    backgroundColor: props.background,
                    ...(props.backgroundImage ? { '--backgroundImage': `url(${context.server.RESOURCE_URL + props.backgroundImage.split(',')[0]})` } : {}),
                    display: filteredComponents.length === 0 ? "none" : ""
                }}
                data-pr-tooltip={props.toolTipText}
                data-pr-position="left">
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
                    compSizes={componentSizes ? new Map([...componentSizes].filter((v, k) => !v[0].includes("-tb"))) : undefined}
                    components={filteredComponents}
                    style={panelGetStyle(
                        false,
                        layoutStyle,
                        prefSize,
                        props.screen_modal_ || props.content_modal_,
                        props.screen_size_,
                        appVersion.version
                    )}
                    parent={props.parent} />
            </div>
        </>
    )
}

const UIToolBarHelper: FC<IToolBarHelper> = (baseProps) => {
    /** Component constants */
    const [context,, [props]] = useComponentConstants<IToolBarHelper>(baseProps, {visibility: 'hidden'});

    /** Reports itself to the layout */
    useLayoutEffect(() => {
        const reportFunc = () => panelReportSize(
            props.id,
            "P",
            { height: 0, width: 0 },
            props.className,
            { height: 0, width: 0 },
            props.preferredSize,
            props.minimumSize,
            props.maximumSize,
            props.onLoadCallback
        )
        if (props.className === COMPONENT_CLASSNAMES.TOOLBARHELPERMAIN) {
            if (props.toolBarVisible === false) {
                reportFunc();
            }
            else if (props.toolBarVisible === undefined) {
                if (context.contentStore.getChildren(props.id, props.className).size === 0 && props.className === COMPONENT_CLASSNAMES.TOOLBARHELPERMAIN) {
                    reportFunc();
                }
            }
        }
    }, [props.onLoadCallback, props.id, props.preferredSize, props.maximumSize, props.minimumSize]);

    return (
        (props.className === COMPONENT_CLASSNAMES.TOOLBARHELPERMAIN) ?
            (props.toolBarVisible === undefined) ?
                (context.contentStore.getChildren(props.id, props.className).size > 0) ?
                    <ToolBarHelper {...props} />
                    :
                    <div style={{ visibility: "hidden" }} />
                :
                (props.toolBarVisible) ? <ToolBarHelper {...props} /> : <div style={{ visibility: "hidden" }} />
            :
            <ToolBarHelper {...props} />
    )
}
export default UIToolBarHelper