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
    const menuClassList = forwardedRef.current?.classList

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
                    label: context.contentStore.currentUser.displayName,
                    icon: context.contentStore.currentUser.profileImage ? 'profileImage' : 'noProfileImage fa fa-user',
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
            <div className="profileMenu">
                <Menubar
                    ref={slideRef}
                    model={slideOptions}/>
            </div>
        )
    },[slideRef , context.contentStore.currentUser, context.contentStore.flatContent, context.contentStore.removedContent, context.server, menuClassList]);

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
        if (document.querySelector('.profileImage') && context.contentStore.currentUser.profileImage)
            (document.querySelector('.profileImage') as HTMLElement).style.setProperty('background-image', "url(data:image/jpeg;base64,"+ context.contentStore.currentUser.profileImage + ')');
    },[profileMenu])


    const handleToggleClick = () => {
        context.contentStore.emitMenuCollapse();
    }

    return(
        <div className="menu">
            <div className="topMenuBar">
                <div className={"logoWrap" + (menuCollapsed ? " collapsed" : "")}>
                    <img className="logo" src={(process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.contentStore.LOGO} alt="logo" />
                </div>
                <i onClick={handleToggleClick} className="menuToggler pi pi-bars" />
                {profileMenu}
                {/* <Menubar start={() => <img src={(process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.contentStore.LOGO} alt="logo" style={{marginRight: '20px'}}/>} model={menuItems} className="p-col" end={() => profileMenu()}/> */}
            </div>
            <div ref={forwardedRef} className={"menuWrap" + (menuCollapsed ? " collapsed" : "")}>
                <PanelMenu model={menuItems} />
            </div>
        </div>
    )
}
export default Menu;