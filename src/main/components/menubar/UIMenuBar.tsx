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

import { Menubar } from "primereact/menubar";
import React, { FC, useEffect, useMemo, useRef } from "react";
import useComponents from "../../hooks/components-hooks/useComponents";
import useMenuItems from "../../hooks/data-hooks/useMenuItems";
import useProperties from "../../hooks/data-hooks/useProperties";
import COMPONENT_CLASSNAMES from "../COMPONENT_CLASSNAMES";

/**
 * This component displays a menubar for a frame
 * @param baseProps - the base properties received from the frame
 */
const UIMenuBar: FC<any> = (baseProps) => {
    const [props] = useProperties<any>(baseProps.id, baseProps);

    const [children] = useComponents(props.id, props.className);

    const menuRef = useRef<HTMLDivElement>(null);

    const menuChildren = useMemo(() => children.filter(component => component.className === COMPONENT_CLASSNAMES.MENU).map(menu => menu.id), [children]);

    const menuItems = useMenuItems(menuChildren);

    useEffect(() => {
        if (menuRef.current) {
            baseProps.sizeCallback({ height: menuRef.current.offsetHeight, width: menuRef.current.offsetWidth});
        }
    }, [menuItems]);

    return (
        <div ref={menuRef} className={props.style} id={props.name}>
            <Menubar  model={menuItems} />
        </div>
    )
}
export default UIMenuBar