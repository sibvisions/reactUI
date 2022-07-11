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

import React, { FC, useCallback, useContext, useEffect, useLayoutEffect, useState } from "react";
import { Menubar } from 'primereact/menubar';
import { SpeedDial } from "primereact/speeddial";
import { Tooltip } from 'primereact/tooltip'
import { MenuItem } from "primereact/menuitem";
import { IMenu, ProfileMenu } from "./Menu";
import { showTopBar } from "../../main/components/topbar/TopBar";
import ContentStore from "../../main/contentstore/ContentStore";
import { EmbeddedContext } from "../../main/contexts/EmbedProvider";
import useConstants from "../../main/hooks/components-hooks/useConstants";
import useScreenTitle from "../../main/hooks/app-hooks/useScreenTitle";
import useMenuItems from "../../main/hooks/data-hooks/useMenuItems";
import { parseIconData } from "../../main/components/comp-props/ComponentProperties";
import { BaseMenuButton } from "../../main/response/data/MenuResponse";
import { DomHandler } from "primereact/utils";
import useMultipleEventHandler from "../../main/hooks/event-hooks/useMultipleEventHandler";

/**
 * Renders the menu as a topbar and a menubar below, when the application-layout is corporation
 * @param props - the properties the menu receives from the UIManager.
 */
const CorporateMenu:FC<IMenu> = (props) => {
    /** Returns utility variables */
    const [context, topbar] = useConstants();

    /** True, if the application is embedded, then don't display the menu */
    const embeddedContext = useContext(EmbeddedContext);

    /** Current state of screen title, displays the screen title */
    const screenTitle = useScreenTitle();

    /** get menu items */
    const menuItems = useMenuItems();

    /** 
     * Returns an array of created toolbar-items based on the toolbar-item-data sent by the server.
     * Is called when the server sends toolbar-data
     * @param toolbarItems - An array of toolbar-items sent by the server.
     */
    const handleNewToolbarItems = useCallback((toolbarItems: Array<MenuItem>) => {
        const tbItems = new Array<MenuItem>();
        toolbarItems.forEach(item => {
            const iconData = parseIconData(undefined, item.image)
            const toolbarItem:MenuItem = {
                label: item.text,
                icon: iconData.icon,
                command: () => showTopBar(item.action(), topbar)
            }
            tbItems.push(toolbarItem);
        });
        return tbItems
    }, [topbar])

    /** State of the toolbar-items */
    const [toolbarItems, setToolbarItems] = useState<Array<MenuItem>>(handleNewToolbarItems((context.contentStore as ContentStore).toolbarItems));

    useLayoutEffect(() => {
        if (menuItems) {
            const submenus = document.getElementsByClassName("p-submenu-list");
            let i = 0;
            for (let submenu of submenus) {
                const parent = submenu.parentElement;
                const wrapper = document.createElement('div');
                wrapper.classList.add("wrapper")
                wrapper.classList.add(i.toString())

                if (parent && !parent.classList.contains("wrapper")) {
                    parent.replaceChild(wrapper, submenu);
                    wrapper.appendChild(submenu);
                }
                i++
            }
        }
    }, [menuItems])

    /** 
     * The corporate-menu subscribes to the screen name and app-settings, so everytime these properties change the state
     * will get updated.
     *  @returns unsubscribing from the screen name on unmounting
     */
    useEffect(() => {
        context.subscriptions.subscribeToToolBarItems((toolBarItems:Array<BaseMenuButton>) => setToolbarItems(handleNewToolbarItems(toolBarItems)));

        return () => context.subscriptions.unsubscribeFromToolBarItems((toolBarItems:Array<BaseMenuButton>) => setToolbarItems(handleNewToolbarItems(toolBarItems)));
    }, [context.subscriptions]);

    //@ts-ignore
    console.log(DomHandler.find(document.getElementsByClassName("corp-menu-menubar")[0], ".is-submenu"), document.getElementsByClassName("corp-menu-menubar")[0], menuItems)

    //@ts-ignore
    useMultipleEventHandler(DomHandler.find(document.getElementsByClassName("corp-menu-menubar")[0], ".is-submenu").length ? 
    //@ts-ignore
    DomHandler.find(document.getElementsByClassName("corp-menu-menubar")[0], ".is-submenu") : undefined, "mouseover",
    (event:any) => {
        if (event.target.tagName === "A" || event.target.tagName === "SPAN") {
            const menuItem = event.target.closest(".is-submenu");
            const submenuWrapper = menuItem.querySelector(".wrapper");
            const menuItemPos = { top: menuItem.offsetTop, left: menuItem.offsetLeft };
            submenuWrapper.style.top = menuItemPos.top + 'px';
            submenuWrapper.style.left = menuItemPos.left + Math.round(menuItem.offsetWidth) + 'px'
        }
        else {
            const menuItem = event.target.querySelector(".p-menuitem-active.is-submenu");
            if (menuItem) {
                const submenuWrapper = menuItem.querySelector(".wrapper");
                const menuItemPos = { top: menuItem.offsetTop, left: menuItem.offsetLeft };
                submenuWrapper.style.top = menuItemPos.top + 'px';
                submenuWrapper.style.left = menuItemPos.left + Math.round(menuItem.offsetWidth) + 'px'
            }
        }
    })

    return (
        <>
            {(!embeddedContext) &&
                <div className="corp-menu">
                    <div className="corp-menu-topbar">
                        <div className="corp-menu-header">
                            <div className="corp-menu-logo-wrapper">
                                <img
                                    className="menu-logo"
                                    draggable="false"
                                    src={(process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.appSettings.LOGO_BIG} alt="logo" />
                            </div>
                            <span className="menu-screen-title">{screenTitle}</span>
                            <div className="corp-menu-profile">
                                <ProfileMenu showButtons />
                            </div>
                        </div>
                        {props.menuOptions.menuBar &&
                            <div className="corp-menu-menubar">
                                {props.menuOptions.toolBar && toolbarItems && toolbarItems.length > 0 &&
                                    <div style={{ maxHeight: "32px", minWidth: "32px" }}>
                                        <Tooltip target=".p-speeddial-linear .p-speeddial-action" position="right" />
                                        <SpeedDial model={toolbarItems} direction="down" />
                                    </div>
                                }
                                <Menubar model={menuItems} />
                            </div>
                        }
                    </div>
                </div>
            }
        </>
    )
}
export default CorporateMenu