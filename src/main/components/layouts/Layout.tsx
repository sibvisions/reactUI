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
import { BorderLayout, 
         FlowLayout, 
         FormLayout, 
         GridLayout, 
         NullLayout } from './index';
import { ComponentSizes } from "../../hooks";
import { Dimension } from "../../util";

/**
 * General information for layouts:
 * The Layout will start calculating when every child component of them reports its size. It will resize itself when the window resizes
 * or a component changes. Every component reports its preferredSize after measuring itself, then the layout calculates the constraints
 * for the componenst and "tells" them which size they are.
 */

 /** Interface for layouts */
export interface ILayout{
    id: string,
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
    parent?:string
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