import { MenuItem } from "primereact/menuitem";
import { useEffect, useState, useContext } from "react";
import { appContext } from "../../../main/AppProvider";
import { parseIconData } from "../compprops";
import { showTopBar, TopBarContext } from "../topbar/TopBar";
import BaseComponent from "../BaseComponent";

const useMenuItems = (menus:string[]) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);
    /** Current state of menu items */
    const [menuItems, setMenuItems] = useState<Array<MenuItem>>();

    /** 
     * Subscribes to menuchanges and builds the menu everytime the menu changes and sets the current state of menuitems
     * @returns unsubscribing from menuchanges on unmount
     */
    useEffect(() => {
        const receiveNewMenuItems = (menuId:string) => {
            //TODO: Rausfinden ob Gruppe im State existiert, wenn ja löschen und zum State mit prevState hinzufügen.
            const primeMenu = new Array<MenuItem>();

            const getSubItems = (arr: BaseComponent[]) => {
                return arr.map(menuItem => {
                    const iconData = parseIconData(undefined, menuItem.image)
                    const subMenuItem = {
                        //command: () => showTopBar(menuItems.action(), topbar),
                        command: () => console.log('clicked', menuItem.text),
                        label: menuItem.text,
                        icon: iconData.icon
                    }
                    return subMenuItem
                })
            }

                const menuGroup = context.contentStore.getComponentById(menuId);
                if (menuGroup) {
                    const menuItems = Array.from(context.contentStore.getChildren(menuId).values()).filter(item => item.visible !== false);
                    const iconData = parseIconData(undefined, menuGroup.image)
                    const newMenuGroup = {
                        label: menuGroup.text,
                        icon: iconData.icon,
                        items: menuItems.length ? getSubItems(menuItems) : []
                    }
                    primeMenu.push(newMenuGroup);
                }
            console.log(primeMenu);
            setMenuItems(primeMenu);
        }

        menus.forEach(menu => {
            receiveNewMenuItems(menu);
        });

        menus.forEach(menu => {
            context.subscriptions.subscribeToParentChange(menu, () => receiveNewMenuItems(menu))   
        });

        //context.subscriptions.subscribeToMenuChange(receiveNewMenuItems);

        return () => {
            menus.forEach(menu => {
                context.subscriptions.unsubscribeFromParentChange(menu);
            });
        }
    }, [context.subscriptions]);

    return menuItems;
}

export default useMenuItems;