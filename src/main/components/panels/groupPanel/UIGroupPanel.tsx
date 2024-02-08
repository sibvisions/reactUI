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

import React, { CSSProperties, FC, useCallback } from "react";
import { Tooltip } from "primereact/tooltip";
import { IPanel, panelGetStyle, panelReportSize } from "../panel/UIPanel";
import useComponents from "../../../hooks/components-hooks/useComponents";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../../util/component-util/SizeUtil";
import Dimension from "../../../util/types/Dimension";
import { concatClassnames } from "../../../util/string-util/ConcatClassnames";
import usePopupMenu from "../../../hooks/data-hooks/usePopupMenu";
import Layout from "../../layouts/Layout";
import { IComponentConstants } from "../../BaseComponent";

/**
 * This component is a panel with a header, useful to group components
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIGroupPanel: FC<IPanel & IComponentConstants> = (props) => {
    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [, components, componentSizes] = useComponents(props.id, props.className);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = props;

    /** Preferred size of panel */
    const prefSize = parsePrefSize(props.preferredSize);

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
            props.styleClassNames,
            minSize, 
            props.preferredSize, 
            props.minimumSize, 
            props.maximumSize, 
            onLoadCallback
        )
    }, [onLoadCallback]);

    return (
        <>
            <Tooltip target={"#" + props.name} />
            <div
                ref={props.forwardedRef}
                className={concatClassnames("rc-panel-group", props.styleClassNames)}
                id={props.name}
                {...usePopupMenu(props)}
                style={props.screen_modal_ || props.content_modal_ ?
                    { height: (prefSize?.height as number), width: prefSize?.width }
                    : { ...props.layoutStyle, background: props.compStyle.background }}
                data-pr-tooltip={props.toolTipText}
                data-pr-position="left" >
                <div
                    className="rc-panel-group-caption"
                    style={{ ...props.compStyle }}
                    dangerouslySetInnerHTML={{ __html: props.text as string }} >
                </div>
                <div
                    className="rc-panel-group-content"
                    style={{ ...(props.backgroundImage ? { '--backgroundImage': `url(${props.context.server.RESOURCE_URL + props.backgroundImage.split(',')[0]})` } as CSSProperties : {}) }}>
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
                            true,
                            props.layoutStyle,
                            prefSize,
                            props.screen_modal_ || props.content_modal_,
                            props.screen_size_,
                            props.context.transferType
                        )}
                        parent={props.parent} />
                </div>
            </div>
        </>
    )
}

export default UIGroupPanel