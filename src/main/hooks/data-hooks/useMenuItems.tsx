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

import { MenuItem } from "primereact/menuitem";
import { useEffect, useState, useContext } from "react";
import { MenuItemCustom } from "../../../application-frame/menu/Menu";
import { appContext } from "../../contexts/AppProvider";
import { showTopBar, TopBarContext } from "../../components/topbar/TopBar";
import BaseComponent from "../../util/types/BaseComponent";
import { createDispatchActionRequest } from "../../factories/RequestFactory";
import { isFAIcon } from "../event-hooks/useButtonMouseImages";
import ContentStoreFull from "../../contentstore/ContentStoreFull";
import { ServerMenuButtons } from "../../response/data/MenuResponse";
import { parseIconData } from "../../components/comp-props/ComponentProperties";
import REQUEST_KEYWORDS from "../../request/REQUEST_KEYWORDS";
import { concatClassnames } from "../../util/string-util/ConcatClassnames";
import { isCorporation } from "../../util/server-util/IsCorporation";

const useMenuItems = (menus?:string[], isCorp?:boolean) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);
    /** Current state of menu items */
    const [menuItems, setMenuItems] = useState<Array<MenuItem>>([]);
    /** The current app-theme e.g. "basti" */
    const [appTheme, setAppTheme] = useState<string>(context.appSettings.applicationMetaData.applicationTheme.value);

    useEffect(() => {
        context.subscriptions.subscribeToTheme("menuitems", (theme:string) => setAppTheme(theme));

        return () => {
            context.subscriptions.unsubscribeFromTheme("menuitems");
        }
    }, [context.subscriptions])

    /** 
     * Subscribes to menuchanges and builds the menu everytime the menu changes and sets the current state of menuitems
     * @returns unsubscribing from menuchanges on unmount
     */
    useEffect(() => {
        // Returns a menu-item which can be used by the PrimeReact MenuModel-API
        const getMenuItem = (item: ServerMenuButtons|BaseComponent, isSingleGroup:boolean):MenuItemCustom|MenuItem => {
            // Checks if the given item has been sent by the server transfertype full
            const isBaseComp = (item:ServerMenuButtons|BaseComponent): item is BaseComponent => {
                return (item as BaseComponent).id !== undefined
            }

            const iconData = parseIconData(undefined, item.image)

            const getItemLabel = (item:ServerMenuButtons|BaseComponent) => {
                if (!isBaseComp(item)) {
                    if (item.quickBarText) {
                        return item.quickBarText;
                    }
                    else if (item.sideBarText) {
                        return item.sideBarText;
                    }
                }
                return item.text
            }

            // Setting initial menu-item properties
            const menuItem:MenuItem = {
                label: getItemLabel(item),
                icon: iconData.icon,
                style: {...(!isFAIcon(iconData.icon) ? {
                    '--iconWidth': `${iconData.size?.width}px`,
                    '--iconHeight': `${iconData.size?.height}px`,
                    '--iconColor': iconData.color,
                    '--iconImage': `url(${context.server.RESOURCE_URL + iconData.icon})`,
                } : {})},
                disabled: item.enabled === false,
                separator: item.className === "Separator" ? true : false,
            }

            // If the item is sent by the server add a dispatch-action command and if the icon is custom add a classname
            if (isBaseComp(item)) {
                menuItem.command = item.eventAction 
                ? 
                    () => {
                        const req = createDispatchActionRequest();
                        req.componentId = item.name;
                        showTopBar(context.server.sendRequest(req, REQUEST_KEYWORDS.PRESS_BUTTON), topbar);
                    }  
                : 
                    undefined
                menuItem.className = !isFAIcon(iconData.icon) ? "custom-menu-icon" : "";
                return menuItem
            }
            // If transferType is partial add some more properties which are needed by the menu
            else {
                const castedMenuItem = menuItem as MenuItemCustom
                castedMenuItem.command = () => showTopBar(item.action(), topbar);
                castedMenuItem.className = concatClassnames(item.componentId.split(':')[0], !isFAIcon(iconData.icon) ? "custom-menu-icon" : "", isSingleGroup && !isCorporation(isCorp ? "corporation" : "standard", appTheme) ? "single-group-item" : "");
                castedMenuItem.componentId = item.componentId;
                castedMenuItem.screenClassName = item.componentId.split(':')[0];
                return castedMenuItem;
            }
        }

        // Builds the menu-item hirarchy for transferType partial
        const receiveNewMenuItems = (menuGroup: Map<string, Array<ServerMenuButtons>>) => {
            let primeMenu = new Array<MenuItem>();

            // Returns an array of menu-items for the Prime-React menu
            const getSubItems = (arr: Array<ServerMenuButtons>, isSingleGroup: boolean) => {
                return arr.map(menuItem => getMenuItem(menuItem, isSingleGroup));
            }

            if (menuGroup.size === 1 && !isCorporation(isCorp ? "corporation" : "standard", appTheme)) {
                const singleGroup = menuGroup.entries().next().value[1];
                primeMenu = getSubItems(singleGroup, true);
            }
            else {
                menuGroup.forEach((value, key) => {
                    // Split for submenus
                    const nameSplit = key.split("/");
                    let menuIterator = primeMenu;
                    let i = 0
                    while (i < nameSplit.length) {
                        const foundMenuGroup = menuIterator.find(item => item.label === nameSplit[i]);
                        // If the menu-group hasn't been found add it
                        if (!foundMenuGroup) {
                            const newMainMenuGroup = {
                                label: nameSplit[i],
                                icon: undefined,
                                // If i is nameSplit.length - 1 it is the last level and we can just get the final subitem-level
                                // If not we can leave the items array empty and it gets filled later.
                                items: i === nameSplit.length - 1 ?
                                getSubItems(value, false) : [],
                                className: i !== 0 ? "is-submenu " : ""
                            };
                            // The new menu-group gets pushed to the menu-iterator and the new menuIterator becomes the menu-groups (sub-)items array
                            // because the next entries in the loop can only be children of the menu-group
                            menuIterator.push(newMainMenuGroup)
                            menuIterator = newMainMenuGroup.items;
                        }
                        // If the menu-group has been found, add the subitems to the existing ones
                        else {
                            if (i === nameSplit.length - 1) {
                                foundMenuGroup.items = [...(foundMenuGroup.items as MenuItem[]), ...getSubItems(value, false)];
                            }
                            menuIterator = foundMenuGroup.items as MenuItem[];
                        }
                        i++;
                    }
                });
            }


            setMenuItems(primeMenu);
        }

        // Builds the menu-item hirarchy for transferType full
        const receiveNewMenuItemsV2 = (menuId:string) => {
            let primeMenu:MenuItem = {};

            // Returns an array of menu-items for the Prime-React menu
            const getSubItems = (arr: BaseComponent[]) => {
                return arr.map(menuItem => getMenuItem(menuItem, false))
            }

            // Check if the menuId is in the contentstore and add it
            const menuGroup = context.contentStore.getComponentById(menuId);
            if (menuGroup) {
                const menuItems = Array.from((context.contentStore as ContentStoreFull).getChildren(menuId).values()).filter(item => item.visible !== false);
                const iconData = parseIconData(undefined, menuGroup.image);
                primeMenu = {
                    label: menuGroup.text,
                    icon: iconData.icon,
                    items: menuItems.length ? getSubItems(menuItems) : []
                }
            }
            return primeMenu
        }

        // TransferType full builds menus, sets the state and needs to subscribe to parent-changes
        if (context.transferType === "full") {
            if (menus) {
                const tempMenuItems:MenuItem[] = []
                menus.forEach((menu) => {
                    tempMenuItems.push(receiveNewMenuItemsV2(menu));
                });
                setMenuItems(tempMenuItems);
        
                menus.forEach(menu => {
                    context.subscriptions.subscribeToParentChange(menu, () => setMenuItems(prevState => {
                        const menuCopy = prevState
                        const newMenu = receiveNewMenuItemsV2(menu);
                        const foundIndex = prevState.findIndex(oldMenu => oldMenu.label === newMenu.label);
                        if (foundIndex !== -1) {
                            menuCopy[foundIndex] = newMenu
                        }
                        else {
                            menuCopy.push(newMenu);
                        }
                        return menuCopy;
                    }))   
                });
            }
        }
        //TransferType partial builds menus and subscribes to menu-change
        else {
            receiveNewMenuItems(context.contentStore.menuItems);
            context.subscriptions.subscribeToMenuChange(receiveNewMenuItems);
        }

        return () => {
            if (menus) {
                menus.forEach(menu => {
                    context.subscriptions.unsubscribeFromParentChange(menu);
                });
            }
            else {
                context.subscriptions.unsubscribeFromMenuChange(receiveNewMenuItems)
            }
        }
    }, [context.subscriptions, menus, appTheme]);

    return menuItems;
}

export default useMenuItems;