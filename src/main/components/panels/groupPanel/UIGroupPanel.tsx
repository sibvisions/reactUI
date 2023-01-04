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

import React, { CSSProperties, FC, useCallback, useRef } from "react";
import { Tooltip } from "primereact/tooltip";
import { IPanel, panelGetStyle, panelReportSize } from "../panel/UIPanel";
import useComponentConstants from "../../../hooks/components-hooks/useComponentConstants";
import useComponents from "../../../hooks/components-hooks/useComponents";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../../util/component-util/SizeUtil";
import useMouseListener from "../../../hooks/event-hooks/useMouseListener";
import Dimension from "../../../util/types/Dimension";
import { concatClassnames } from "../../../util/string-util/ConcatClassnames";
import usePopupMenu from "../../../hooks/data-hooks/usePopupMenu";
import Layout from "../../layouts/Layout";
import useAddLayoutStyle from "../../../hooks/style-hooks/useAddLayoutStyle";

/**
 * This component is a panel with a header, useful to group components
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIGroupPanel: FC<IPanel> = (baseProps) => {
    /** Component constants */
    const [context,, [props], layoutStyle, compStyle] = useComponentConstants<IPanel>(baseProps, {visibility: 'hidden'});

    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [, components, componentSizes] = useComponents(baseProps.id, props.className);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** Preferred size of panel */
    const prefSize = parsePrefSize(props.preferredSize);

    /** Reference for the panel element */
    const panelRef = useRef<any>(null);

    /** Hook for MouseListener */
    useMouseListener(props.name, panelRef.current ? panelRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** 
     * The component reports its preferred-, minimum-, maximum and measured-size to the layout
     * In panels, this method will be passed to the layouts
     */
    const reportSize = useCallback((prefSize:Dimension, minSize?:Dimension) => {
        panelReportSize(
            id, 
            "G", 
            prefSize,
            props.className,
            minSize, 
            props.preferredSize, 
            props.minimumSize, 
            props.maximumSize, 
            onLoadCallback
        )
    }, [onLoadCallback]);

    useAddLayoutStyle(panelRef.current, layoutStyle, onLoadCallback);

    return (
        <>
            <Tooltip target={"#" + props.name} />
            <div
                ref={panelRef}
                className={concatClassnames("rc-panel-group", props.style)}
                id={props.name}
                {...usePopupMenu(props)}
                style={props.screen_modal_ || props.content_modal_ ?
                    { height: (prefSize?.height as number), width: prefSize?.width }
                    : { ...layoutStyle, background: compStyle.background }}
                data-pr-tooltip={props.toolTipText}
                data-pr-position="left" >
                <div
                    className="rc-panel-group-caption"
                    style={{ ...compStyle }}
                    dangerouslySetInnerHTML={{ __html: props.text as string }} >
                    {/* <span>
                        {props.text}
                    </span> */}
                </div>
                <div
                    className="rc-panel-group-content"
                    style={{ ...(props.backgroundImage ? { '--backgroundImage': `url(${context.server.RESOURCE_URL + props.backgroundImage.split(',')[0]})` } as CSSProperties : {}) }}>
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
                        compSizes={componentSizes}
                        components={components}
                        style={panelGetStyle(
                            true,
                            layoutStyle,
                            prefSize,
                            props.screen_modal_ || props.content_modal_,
                            props.screen_size_,
                            context.transferType
                        )}
                        parent={props.parent} />
                </div>
            </div>
        </>
    )
}

export default UIGroupPanel