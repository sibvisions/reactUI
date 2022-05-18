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
import { ServerMenuButtons } from "../../response";
import { appContext } from "../../AppProvider";
import { parseIconData } from "../../components/comp-props";
import { showTopBar, TopBarContext } from "../../components/topbar/TopBar";
import BaseComponent from "../../util/types/BaseComponent";
import { createDispatchActionRequest } from "../../factories/RequestFactory";
import { isFAIcon } from "../event-hooks/useButtonMouseImages";
import { REQUEST_KEYWORDS } from "../../request";
import { concatClassnames } from "../../util";
import ContentStoreV2 from "../../contentstore/ContentStoreV2";

const useMenuItems = (menus?:string[]) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);
    /** Current state of menu items */
    const [menuItems, setMenuItems] = useState<Array<MenuItem>>([]);

    /** 
     * Subscribes to menuchanges and builds the menu everytime the menu changes and sets the current state of menuitems
     * @returns unsubscribing from menuchanges on unmount
     */
    useEffect(() => {
        const getMenuItem = (item: ServerMenuButtons|BaseComponent):MenuItemCustom|MenuItem => {
            const isBaseComp = (item:ServerMenuButtons|BaseComponent): item is BaseComponent => {
                return (item as BaseComponent).id !== undefined
            }
            const iconData = parseIconData(undefined, item.image)
            const menuItem:MenuItem = {
                label: item.text,
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
            else {
                const castedMenuItem = menuItem as MenuItemCustom
                castedMenuItem.command = () => showTopBar(item.action(), topbar);
                castedMenuItem.className = concatClassnames(item.componentId.split(':')[0], !isFAIcon(iconData.icon) ? "custom-menu-icon" : "");
                castedMenuItem.componentId = item.componentId;
                castedMenuItem.screenClassName = item.componentId.split(':')[0];
                return castedMenuItem;
            }
        }

        const receiveNewMenuItems = (menuGroup: Map<string, Array<ServerMenuButtons>>) => {
            const primeMenu = new Array<MenuItem>();

            const getSubItems = (arr: Array<ServerMenuButtons>) => {
                return arr.map(menuItem => getMenuItem(menuItem));
            }

            menuGroup.forEach((value, key) => {
                const nameSplit = key.split("/");
                let menuIterator = primeMenu;
                let i = 0
                while (i < nameSplit.length) {
                    const foundEntry = menuIterator.find(item => item.label === nameSplit[i]);
                    if (!foundEntry) {
                        const newMainMenuGroup = {
                            label: nameSplit[i],
                            icon: undefined,
                            items: i === nameSplit.length - 1 ?
                            getSubItems(value) : []
                        };
                        menuIterator.push(newMainMenuGroup)
                        menuIterator = newMainMenuGroup.items;
                    }
                    else {
                        if (i === nameSplit.length - 1) {
                            foundEntry.items = [...(foundEntry.items as MenuItem[]), ...getSubItems(value)];
                        }
                        menuIterator = foundEntry.items as MenuItem[];
                    }
                    i++;
                }
            });
            setMenuItems(primeMenu);
        }

        const receiveNewMenuItemsV2 = (menuId:string) => {
            let primeMenu:MenuItem = {};

            const getSubItems = (arr: BaseComponent[]) => {
                return arr.map(menuItem => getMenuItem(menuItem))
            }

            const menuGroup = context.contentStore.getComponentById(menuId);
            if (menuGroup) {
                const menuItems = Array.from((context.contentStore as ContentStoreV2).getChildren(menuId).values()).filter(item => item.visible !== false);
                const iconData = parseIconData(undefined, menuGroup.image);
                primeMenu = {
                    label: menuGroup.text,
                    icon: iconData.icon,
                    items: menuItems.length ? getSubItems(menuItems) : []
                }
            }
            return primeMenu
        }

        if (context.version === 2) {
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
    }, [context.subscriptions, menus]);

    return menuItems;
}

export default useMenuItems;