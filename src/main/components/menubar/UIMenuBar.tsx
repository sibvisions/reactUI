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
import React, { FC, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import useComponents from "../../hooks/components-hooks/useComponents";
import useMenuItems from "../../hooks/data-hooks/useMenuItems";
import useProperties from "../../hooks/data-hooks/useProperties";
import useDesignerUpdates from "../../hooks/style-hooks/useDesignerUpdates";
import COMPONENT_CLASSNAMES from "../COMPONENT_CLASSNAMES";

/**
 * This component displays a menubar for a frame
 * @param baseProps - the base properties received from the frame
 */
const UIMenuBar: FC<any> = (baseProps) => {
    /** The current state of the properties sent by the server */
    const [props] = useProperties<any>(baseProps.id, baseProps);

    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [children] = useComponents(props.id, props.className);

    /** Reference of the menu-wrapper */
    const menuRef = useRef<HTMLDivElement>(null);

    /** The menu-item component children sent by the server */
    const menuChildren = useMemo(() => children.filter(component => component.className === COMPONENT_CLASSNAMES.MENU).map(menu => menu.id), [children]);

    /** The menu-items sent by the server changed into objects which PrimeReact's MenuModel-API can use */
    const menuItems = useMenuItems(menuChildren);

    const designerUpdate = useDesignerUpdates('menubar');

    // Adds a wrapper div to all submenu-lists, for the submenus to be correctly displayed when there are sub-submenus
    useLayoutEffect(() => {
        if (menuItems) {
            const submenus = document.getElementsByClassName("p-submenu-list");
            for (let submenu of submenus) {
                if (submenu.closest(".p-menubar") && !submenu.closest(".p-menubar")!.classList.contains("profile-menubar")) {
                    const parent = submenu.parentElement;
                    const wrapper = document.createElement('div');
                    wrapper.classList.add("wrapper")
    
                    if (parent && !parent.classList.contains("wrapper")) {
                        parent.replaceChild(wrapper, submenu);
                        wrapper.appendChild(submenu);
                    }
                }
            }
        }
    }, [menuItems])

    // When the menu-items are loded, call the size-callback to tell the frame the size of the menu.
    useEffect(() => {
        if (menuRef.current) {
            baseProps.sizeCallback({ height: menuRef.current.offsetHeight, width: menuRef.current.offsetWidth});
        }
    }, [menuItems, designerUpdate]);

    return (
        <div ref={menuRef} className={props.style} id={props.name}>
            <Menubar model={menuItems} />
        </div>
    )
}
export default UIMenuBar