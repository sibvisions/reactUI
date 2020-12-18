//React
import React, {FC, useContext, useEffect, useMemo, useRef, useState} from "react";

//Custom
import {createLogoutRequest} from "../../JVX/factories/RequestFactory";
import REQUEST_ENDPOINTS from "../../JVX/request/REQUEST_ENDPOINTS";
import MenuItemCustom from "../../primeExtension/MenuItemCustom";
import {jvxContext} from "../../JVX/jvxProvider";

//Prime
import { PanelMenu } from 'primereact/panelmenu';
import { Menubar } from 'primereact/menubar';
import {SlideMenu} from "primereact/slidemenu";
import {MenuItem} from "primereact/api";

import {serverMenuButtons} from "../../JVX/response/MenuResponse";
import { parseIconData } from "../../JVX/components/compprops/ComponentProperties";
import useMenuCollapser from "src/JVX/components/zhooks/useMenuCollapser";

interface IMenu {
    forwardedRef?: any
}

const Menu: FC<IMenu> = ({forwardedRef}) => {
    const context = useContext(jvxContext);
    const menuCollapsed = useMenuCollapser('menu');
    const [menuItems, changeMenuItems] = useState<Array<MenuItemCustom>>();
    const slideRef = useRef<SlideMenu>(null)
    const currUser = context.contentStore.currentUser;

    const profileMenu = useMemo(() => {
        const sendLogout = () => {
            const logoutRequest = createLogoutRequest();
            localStorage.removeItem("authKey")
            context.contentStore.reset();
            context.server.sendRequest(logoutRequest, REQUEST_ENDPOINTS.LOGOUT);
        }
        const slideOptions: Array<MenuItem> =
            [
                {
                    label: currUser.displayName,
                    icon: currUser.profileImage ? 'profile-image' : 'profile-image-null fa fa-user',
                    items: [
                        {
                            label: "Settings",
                            icon: "pi pi-cog",
                            command: () => {
                                context.server.routingDecider([{ name: "settings" }])
                            }
                        },
                        {
                            label: "Logout",
                            icon: "pi pi-power-off",
                            command(e: { originalEvent: Event; item: MenuItem }) {
                                sendLogout()
                            }
                        }
                    ]
                }
            ]

        return(
            <div className="profile-menu">
                <Menubar
                    ref={slideRef}
                    model={slideOptions}/>
            </div>
        )
    },[slideRef, currUser, context.server, context.contentStore]);

    useEffect(()=> {
        const receiveNewMenuItems = (menuGroup: Map<string, Array<serverMenuButtons>>) => {
            const primeMenu = new Array<MenuItem>();
            menuGroup.forEach((value, key) => {
                const primeMenuItem: MenuItem = {
                    label: key,
                    items: value.map(menuItems => {
                       const iconData = parseIconData(undefined, menuItems.image)
                       const subMenuItem: MenuItemCustom = {
                           command: e => menuItems.action(),
                           label: menuItems.text,
                           componentId: menuItems.componentId,
                           icon: iconData.icon
                       }
                       return subMenuItem
                    })
                }
                primeMenu.push(primeMenuItem);
            });
            changeMenuItems(primeMenu)
        }
        receiveNewMenuItems(context.contentStore.mergedMenuItems);
        context.contentStore.subscribeToMenuChange(receiveNewMenuItems);

        return () => {
            context.contentStore.unsubscribeFromMenuChange(receiveNewMenuItems)
        }
    }, [context.contentStore]);

    useEffect(() => {
        if (document.querySelector('.profile-image') && context.contentStore.currentUser.profileImage)
            (document.querySelector('.profile-image') as HTMLElement).style.setProperty('background-image', "url(data:image/jpeg;base64,"+ context.contentStore.currentUser.profileImage + ')');
    },[profileMenu, context.contentStore.currentUser.profileImage])


    const handleToggleClick = () => {
        context.contentStore.emitMenuCollapse();
    }

    return(
        <div className="menu">
            <div className="menu-topbar">
                <div className={"menu-logo-wrapper" + (menuCollapsed ? " menu-collapsed" : "")}>
                    <img className="menu-logo" src={(process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.contentStore.LOGO} alt="logo" />
                </div>
                <i onClick={handleToggleClick} className="menu-toggler pi pi-bars" />
                {profileMenu}
            </div>
            <div ref={forwardedRef} className={"menu-panelmenu-wrapper" + (menuCollapsed ? " menu-collapsed" : "")}>
                <PanelMenu model={menuItems} />
            </div>
        </div>
    )
}
export default Menu;