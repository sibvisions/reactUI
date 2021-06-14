import { MenuItem } from "primereact/api";
import { useEffect, useState, useContext } from "react";
import { MenuItemCustom } from "../../../frontmask/menu/menu";
import { serverMenuButtons } from "../../../main/response";
import { appContext } from "../../../main/AppProvider";
import { parseIconData } from "../compprops";
import { useParams } from "react-router";
import { showTopBar, TopBarContext } from "../topbar/TopBar";

const useMenuItems = (onUpdate?: (primeMenu: Array<MenuItem>) => void) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);
    /** Current state of menu items */
    const [menuItems, setMenuItems] = useState<Array<MenuItem>>();
    /** The react router params */
    const params = useParams<{componentId: string}>();

    /** 
     * Subscribes to menuchanges and builds the menu everytime the menu changes and sets the current state of menuitems
     * @returns unsubscribing from menuchanges on unmount
     */
    useEffect(()=> {
        const receiveNewMenuItems = (menuGroup: Map<string, Array<serverMenuButtons>>) => {
            const primeMenu = new Array<MenuItem>();
            menuGroup.forEach((value, key) => {
                const primeMenuItem: MenuItem = {
                    label: key,
                    icon: undefined,
                    items: value.map(menuItems => {
                        const iconData = parseIconData(undefined, menuItems.image)
                        const subMenuItem: MenuItemCustom = {
                            command: e => showTopBar(menuItems.action(), topbar),
                            label: menuItems.text,
                            componentId: menuItems.componentId,
                            icon: iconData.icon,
                            className: menuItems.componentId && menuItems.componentId.includes(`.${params.componentId}WorkScreen`) || menuItems.text === params.componentId ? "p-menuitem--active" : undefined,
                        }
                        return subMenuItem
                    })
                }
                primeMenu.push(primeMenuItem);
            });
            setMenuItems(primeMenu);
            onUpdate && onUpdate(primeMenu);
        }
        receiveNewMenuItems(context.contentStore.mergedMenuItems);
        context.subscriptions.subscribeToMenuChange(receiveNewMenuItems);

        return () => {
            context.subscriptions.unsubscribeFromMenuChange(receiveNewMenuItems)
        }
    }, [params, context.subscriptions, context.contentStore.mergedMenuItems]);

    return menuItems;
}

export default useMenuItems;