//React
import React, {FC, useCallback, useContext, useEffect, useMemo, useRef, useState} from "react";

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
import useMenuCollapser from "../../JVX/components/zhooks/useMenuCollapser";
import useWindowObserver from "../../JVX/components/zhooks/useWindowObserver";
import useIsMount from "../../JVX/components/zhooks/useIsMount";

interface IMenu {
    forwardedRef?: any
}

const Menu: FC<IMenu> = ({forwardedRef}) => {
    const context = useContext(jvxContext);
    const menuCollapsed = useMenuCollapser('menu');
    const windowSize = useWindowObserver();
    const isMount = useIsMount();
    const [menuItems, changeMenuItems] = useState<Array<MenuItemCustom>>();
    const [screenTitle, setScreenTitle] = useState<string>("");
    const slideRef = useRef<SlideMenu>(null);
    const menuLogoRef = useRef<HTMLDivElement>(null);
    const menuLogoMiniRef = useRef<HTMLDivElement>(null);
    const fadeRef = useRef<HTMLDivElement>(null);
    const isMountRef = useRef<boolean>(); //ref to not get a warning in useEffect where isMount should be used...
    const currUser = context.contentStore.currentUser;

    const closeOpenedMenuPanel = useCallback(() => {
        if (forwardedRef.current.querySelector('.p-highlight > .p-panelmenu-header-link') !== null)
            forwardedRef.current.querySelector('.p-highlight > .p-panelmenu-header-link').click();
    },[forwardedRef])

    useEffect(() => {
        context.contentStore.subscribeToAppName('x', (appName:string) => {
            setScreenTitle(appName)
        });

        return () => {
            context.contentStore.unsubscribeFromAppName('x');
        }
    })

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
                        // {
                        //     label: "Settings",
                        //     icon: "pi pi-cog",
                        //     command: () => {
                        //         context.server.routingDecider([{ name: "settings" }])
                        //     }
                        // },
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
                    icon: undefined,
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
    },[profileMenu, context.contentStore.currentUser.profileImage]);

    useEffect(() => {
        isMountRef.current = isMount;
    },[isMount])

    useEffect(() => {
        if (!isMountRef.current) {
            if (context.contentStore.menuModeAuto) {
                context.contentStore.setMenuModeAuto(false)
            }
            else {
                if (windowSize === 0) {
                    closeOpenedMenuPanel();
                    context.contentStore.emitMenuCollapse(0);
                }
                    
                else
                    context.contentStore.emitMenuCollapse(1);
            }
        }
    },[context.contentStore, windowSize])

    useEffect(() => {
        if (forwardedRef.current) {
            const menuRef = forwardedRef.current;
            const hoverExpand = () => {
                if (menuRef.classList.contains("menu-collapsed")) {
                    menuRef.classList.add("menu-hover")
                    menuRef.classList.remove("menu-collapsed");
                    if (menuLogoRef.current && fadeRef.current && menuLogoMiniRef.current) {
                        menuLogoRef.current.classList.add("menu-hover")
                        menuLogoRef.current.classList.remove("menu-collapsed");
                        (menuLogoRef.current.children[0] as HTMLImageElement).src = (process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.contentStore.LOGO_BIG;
                        (menuLogoMiniRef.current.children[0] as HTMLImageElement).src = (process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.contentStore.LOGO_BIG;
                        fadeRef.current.style.setProperty('display', 'none');
                    }
                }
            }
            const hoverCollapse = () => {
                if (!forwardedRef.current.classList.contains("menu-collapsed")) {
                    menuRef.classList.add("menu-collapsed");
                    menuRef.classList.remove("menu-hover")
                    if (menuLogoRef.current && fadeRef.current && menuLogoMiniRef.current) {
                        menuLogoRef.current.classList.add("menu-collapsed");
                        menuLogoRef.current.classList.remove("menu-hover");
                        (menuLogoRef.current.children[0] as HTMLImageElement).src = (process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.contentStore.LOGO_SMALL;
                        (menuLogoMiniRef.current.children[0] as HTMLImageElement).src = (process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.contentStore.LOGO_SMALL;
                        fadeRef.current.style.removeProperty('display');
                    }
                    closeOpenedMenuPanel();
                }
            }
    
            if (menuCollapsed) {
                menuRef.addEventListener('mouseover', hoverExpand);
                menuRef.addEventListener('mouseleave', hoverCollapse);
            }
            else {
                menuRef.removeEventListener('mouseover', hoverExpand);
                menuRef.removeEventListener('mouseleave', hoverCollapse);
            }
            return () => {
                menuRef.removeEventListener('mouseover', hoverExpand);
                menuRef.removeEventListener('mouseleave', hoverCollapse);
            }
        }
    },[menuCollapsed, forwardedRef, context.contentStore.LOGO_BIG, context.contentStore.LOGO_SMALL, closeOpenedMenuPanel]);

    const handleToggleClick = () => {
        closeOpenedMenuPanel();
        context.contentStore.setMenuModeAuto(!context.contentStore.menuModeAuto)
        context.contentStore.emitMenuCollapse(2);
    }

    return(
        <div className="menu">
            <div className="menu-topbar">
                <div className={"menu-logo-wrapper" + (menuCollapsed ? " menu-collapsed" : "")} ref={menuLogoRef}>
                    <img className="menu-logo" src={(process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + (menuCollapsed ? context.contentStore.LOGO_SMALL : context.contentStore.LOGO_BIG)} alt="logo" />
                </div>
                <div className={"menu-upper" + ((menuCollapsed || (window.innerWidth <= 600 && context.contentStore.menuOverlaying)) ? " upper-collapsed" : "")}>
                    <i onClick={handleToggleClick} className="menu-toggler pi pi-bars" />
                    <span className="menu-screen-title">{screenTitle}</span>
                    {profileMenu}
                </div>
            </div>
            <div ref={forwardedRef} className={"menu-panelmenu-wrapper" + (menuCollapsed ? " menu-collapsed" : "")}>
                <div className="menu-logo-mini-wrapper" ref={menuLogoMiniRef}>
                    <img className="menu-logo-mini" src={(process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + (menuCollapsed ? context.contentStore.LOGO_SMALL : context.contentStore.LOGO_BIG)} alt="logo" />
                </div>
                <PanelMenu model={menuItems} />
                {menuCollapsed && <div className="fadeout" ref={fadeRef}></div>}
            </div>
        </div>
    )
}
export default Menu;