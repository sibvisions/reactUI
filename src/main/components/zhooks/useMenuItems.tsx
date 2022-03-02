import { MenuItem } from "primereact/menuitem";
import { useEffect, useState, useContext } from "react";
import { appContext } from "../../../main/AppProvider";
import { parseIconData } from "../compprops";
import { showTopBar, TopBarContext } from "../topbar/TopBar";
import BaseComponent from "../BaseComponent";
import { createDispatchActionRequest } from "../../factories/RequestFactory";
import { isFAIcon } from "./useButtonMouseImages";
import { REQUEST_ENDPOINTS } from "../../request";

const useMenuItems = (menus:string[]) => {
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
        const receiveNewMenuItems = (menuId:string) => {
            //TODO: Rausfinden ob Gruppe im State existiert, wenn ja löschen und zum State mit prevState hinzufügen.
            let primeMenu:MenuItem = {};

            const getSubItems = (arr: BaseComponent[]) => {
                return arr.map(menuItem => {
                    const iconData = parseIconData(undefined, menuItem.image);
                    const subMenuItem:MenuItem = {
                        command: menuItem.eventAction ? () => {
                            const req = createDispatchActionRequest();
                            req.componentId = menuItem.name;
                            showTopBar(context.server.sendRequest(req, REQUEST_ENDPOINTS.DISPATCH_ACTION), topbar);
                        }  : undefined,
                        label: menuItem.text,
                        icon: iconData.icon,
                        separator: menuItem.className === "Separator" ? true : false,
                        style: {...(!isFAIcon(iconData.icon) ? {
                            '--iconWidth': `${iconData.size?.width}px`,
                            '--iconHeight': `${iconData.size?.height}px`,
                            '--iconColor': iconData.color,
                            '--iconImage': `url(${context.server.RESOURCE_URL + iconData.icon})`,
                        } : {})},
                        className: !isFAIcon(iconData.icon) ? "custom-menu-icon" : ""
                    }
                    return subMenuItem
                })
            }

                const menuGroup = context.contentStore.getComponentById(menuId);
                if (menuGroup) {
                    const menuItems = Array.from(context.contentStore.getChildren(menuId).values()).filter(item => item.visible !== false);
                    const iconData = parseIconData(undefined, menuGroup.image);
                    primeMenu = {
                        label: menuGroup.text,
                        icon: iconData.icon,
                        items: menuItems.length ? getSubItems(menuItems) : []
                    }
                }
                return primeMenu
        }
        const tempMenuItems:MenuItem[] = []
        menus.forEach((menu) => {
            tempMenuItems.push(receiveNewMenuItems(menu));
        });
        setMenuItems(tempMenuItems);

        menus.forEach(menu => {
            context.subscriptions.subscribeToParentChange(menu, () => setMenuItems(prevState => {
                const menuCopy = prevState
                const newMenu = receiveNewMenuItems(menu);
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

        return () => {
            menus.forEach(menu => {
                context.subscriptions.unsubscribeFromParentChange(menu);
            });
        }
    }, [context.subscriptions, menus]);

    return menuItems;
}

export default useMenuItems;