import { MenuItem } from "primereact/menuitem";
import { useEffect, useState, useContext } from "react";
import { MenuItemCustom } from "../../../frontmask/menu/menu";
import { ServerMenuButtons } from "../../../main/response";
import { appContext } from "../../../main/AppProvider";
import { parseIconData } from "../compprops";
import { showTopBar, TopBarContext } from "../topbar/TopBar";

const useMenuItems = () => {
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
        const receiveNewMenuItems = (menuGroup: Map<string, Array<ServerMenuButtons>>) => {
            const primeMenu = new Array<MenuItem>();

            const getSubItems = (arr: Array<ServerMenuButtons>) => {
                return arr.map(menuItems => {
                    const iconData = parseIconData(undefined, menuItems.image)
                    const subMenuItem: MenuItemCustom = {
                        command: () => showTopBar(menuItems.action(), topbar),
                        label: menuItems.text,
                        componentId: menuItems.componentId,
                        screenClassName: menuItems.componentId.split(':')[0],
                        icon: iconData.icon,
                        className: menuItems.componentId.split(':')[0]
                    }
                    return subMenuItem
                })
            }

            console.log(menuGroup)

            menuGroup.forEach((value, key) => {
                const nameSplit = key.split("/");
                let foundSuper: MenuItem | undefined = primeMenu.find(item => item.label === nameSplit[0]);
                let i = 0
                while (i < nameSplit.length) {
                    let primeMenuItem: MenuItem = {
                        label: nameSplit[i],
                        icon: undefined
                    }
                    //console.log(nameSplit)
                    if (!foundSuper) {
                        primeMenuItem.items = i === nameSplit.length - 1 ?
                            getSubItems(value) : [];
                        primeMenu.push(primeMenuItem);
                    }
                    else {
                        if (i === nameSplit.length - 1) {
                            const subItems = getSubItems(value);
                            primeMenuItem.items = subItems
                            //console.log(subItems, foundSuper, nameSplit[i], primeMenuItem)
                            foundSuper.items = [...foundSuper.items as MenuItem[], primeMenuItem]
                            //console.log(foundSuper.items)
                        }
                        else {
                            primeMenuItem.items = []
                            foundSuper.items = [...foundSuper.items as MenuItem[], primeMenuItem];
                        }
                    }
                    foundSuper = primeMenuItem;
                    i++;
                }
            });
            console.log(primeMenu)
            setMenuItems(primeMenu);
        }
        receiveNewMenuItems(context.contentStore.menuItems);
        context.subscriptions.subscribeToMenuChange(receiveNewMenuItems);

        return () => {
            context.subscriptions.unsubscribeFromMenuChange(receiveNewMenuItems)
        }
    }, [context.subscriptions, context.contentStore.menuItems]);

    return menuItems;
}

export default useMenuItems;