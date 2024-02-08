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

import React, { CSSProperties, FC, ReactElement } from "react";
import { ComponentSizes } from "../../hooks/components-hooks/useComponents";
import Dimension from "../../util/types/Dimension";
import BorderLayout from "./BorderLayout";
import FlowLayout from "./FlowLayout";
import FormLayout from "./FormLayout";
import GridLayout from "./GridLayout";
import NullLayout from "./NullLayout";
import { LayoutAssistant } from "../../util/types/designer/LayoutAssistant";
import { FormLayoutInformation, LAYOUTS } from "../../util/types/designer/LayoutInformation";

/**
 * General information for layouts:
 * The Layout will start calculating when every child component of them reports its size. It will resize itself when the window resizes
 * or a component changes. Every component reports its preferredSize after measuring itself, then the layout calculates the constraints
 * for the componenst and "tells" them which size they are.
 */

 /** Interface for layouts */
export interface ILayout {
    id: string,
    name: string
    className: string
    layout: string,
    layoutData: string,
    preferredSize?: Dimension,
    popupSize?: Dimension,
    minimumSize?: Dimension,
    maximumSize?: Dimension,
    components: Array<ReactElement>
    compSizes: Map<string, ComponentSizes> | undefined
    style: CSSProperties,
    reportSize: Function,
    alignChildrenIfOverflow?: boolean,
    panelType?: string,
    isToolBar?: boolean,
    parent?:string,
    hasBorder?:boolean
}

/** Returns true, if the designer is active */
export function isDesignerActive(layoutAssistant:LayoutAssistant|null) {
    return layoutAssistant !== null;
}

/**
 * Clears lists and maps from the layoutInfo of the given layout assistant
 * @param layoutAssistant - the layout assistant to be cleared
 * @param layoutType - the layout type
 */
export function clearDesignerLayoutInfo(layoutAssistant: LayoutAssistant|null, layoutType: LAYOUTS) {
    if (layoutAssistant && isDesignerActive(layoutAssistant) && layoutAssistant.layoutInfo) {
        layoutAssistant.layoutInfo.componentConstraints.clear();
        layoutAssistant.layoutInfo.componentIndeces = [];
        if (layoutType === LAYOUTS.FORMLAYOUT) {
            const castedLayoutInfo = layoutAssistant.layoutInfo as FormLayoutInformation;
            castedLayoutInfo.horizontalAnchors = [];
            castedLayoutInfo.verticalAnchors = [];
            castedLayoutInfo.anchorToColumnMap.clear();
            castedLayoutInfo.horizontalColumnToAnchorMap.clear();
            castedLayoutInfo.verticalColumnToAnchorMap.clear();
            castedLayoutInfo.advancedLabelPosition = null;
        }
    }
}

/**
 * This component is a "middle man" between a panel and a layout, it takes the props from panel,
 * checks which layout should be used and passes the props to the layout.
 * @param props - props received by panel
 */
const Layout: FC<ILayout> = (props) => {
    if (props.layout) {
        if (props.layout.includes("FormLayout"))
            return <FormLayout {...props} />
        else if (props.layout.includes("BorderLayout"))
            return <BorderLayout {...props} />
        else if (props.layout.includes("FlowLayout"))
            return <FlowLayout {...props} />
        else if (props.layout.includes("GridLayout"))
            return <GridLayout {...props} />
        else
            return <NullLayout {...props} />
    }
    else
        return <NullLayout {...props} />

}
export default Layout