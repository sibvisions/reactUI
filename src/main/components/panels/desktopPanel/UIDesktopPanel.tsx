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

import React, { FC } from "react";
import useComponents from "../../../hooks/components-hooks/useComponents";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../../util/component-util/SizeUtil";
import { concatClassnames } from "../../../util/string-util/ConcatClassnames";
import IBaseComponent from "../../../util/types/IBaseComponent";
import Layout from "../../layouts/Layout";
import { panelGetStyle } from "../panel/UIPanel";
import { IComponentConstants } from "../../BaseComponent";

// Interface for DesktopPanels
export interface IDesktopPanel extends IBaseComponent, IComponentConstants {
    navigationKeysEnabled?: boolean,
    tabMode?: boolean,
    layout: string,
    layoutData: string,
}

/**
 * This component generally is displayed when no other screen is opened, it is also rendered on login if available.
 * @param baseProps - the base propertie sent by the server
 */
const UIDesktopPanel: FC<IDesktopPanel> = (props) => {
    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [, components, componentSizes] = useComponents(props.id, props.className);

    return (
        <div
            className={concatClassnames("rc-desktop-panel", props.styleClassNames)}
            ref={props.forwardedRef}
            id={props.name}
            style={{...props.layoutStyle, backgroundColor: props.background}} >
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
                style={panelGetStyle(false, props.layoutStyle)}
                reportSize={() => {}}
                panelType="DesktopPanel"
                parent={props.parent} />
        </div>
    )
}
export default UIDesktopPanel