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

import React, { FC, useRef } from "react";
import useComponentConstants from "../../hooks/components-hooks/useComponentConstants";
import useComponents from "../../hooks/components-hooks/useComponents";
import useMouseListener from "../../hooks/event-hooks/useMouseListener";
import { concatClassnames } from "../../util/string-util/ConcatClassnames";
import UIFrame from "../frame/UIFrame";
import { IPanel } from "../panels/panel/UIPanel";

export interface IWindow extends IPanel {
    title:string
    layout:string,
    layoutData:string,
    menuBar:string,
    iconImage?: string
    modal: boolean
}

const UIMobileLauncher: FC<IWindow> = (baseProps) => {
    /** Component constants */
    const [context,, [props], layoutStyle,, compStyle] = useComponentConstants<IWindow>(baseProps, {visibility: 'hidden'});

    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [children, components, componentSizes] = useComponents(props.id, props.className);

    /** Reference for the panel element */
    const panelRef = useRef<any>(null);

    /** Hook for MouseListener */
    useMouseListener(props.name, panelRef.current ? panelRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    return (
        <div id={props.name} ref={panelRef} className={concatClassnames(props.style, "rc-mobile-launcher")} style={{...layoutStyle, ...compStyle}}>
            <UIFrame 
                {...props} 
                frameStyle={layoutStyle} 
                children={children} 
                components={components.filter(comp => comp.props["~additional"] !== true)} 
                compSizes={componentSizes ? new Map([...componentSizes].filter(comp => context.contentStore.getComponentById(comp[0])?.["~additional"] !== true)) : undefined}
                sizeCallback={() => context.transferType === "full" ? context.launcherReady = true : undefined} />
        </div>

    )
}
export default UIMobileLauncher