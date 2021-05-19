/** React imports */
import React, { FC, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

/** 3rd Party imports */
import { PanelMenu } from 'primereact/panelmenu';
import { Menubar } from 'primereact/menubar';
import { useParams } from "react-router";

/** Hook imports */
import { useMenuCollapser, useWindowObserver, useTranslation, useMenuItems } from '../../main/components/zhooks'

/** Other imports */
import { appContext } from "../../main/AppProvider";
import { createLogoutRequest } from "../../main/factories/RequestFactory";
import { REQUEST_ENDPOINTS } from "../../main/request";
import { serverMenuButtons } from "../../main/response";
import { parseIconData } from "../../main/components/compprops";
import { IForwardRef } from "../../main/IForwardRef";
import { MenuItemCommandParams, MenuItem } from "primereact/api";
import { concatClassnames } from "../../main/components/util";

/** Extends the PrimeReact MenuItem with componentId */
export interface MenuItemCustom extends MenuItem {
    componentId:string
}

interface IMenu extends IForwardRef {
    showMenuMini:boolean
}

/**
 * Manu component builds and displays the menu for reactUI, consists of a topbar with a profile-menu and a sidebar with panel-menu.
 * @param forwardedRef - receives a reference so the reference can be used in other components
 */
const Menu: FC<IMenu> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** Flag if the manu is collpased or expanded */
    const menuCollapsed = useMenuCollapser('menu');
    /** Flag if menu should be collapsed based on windowsize */
    const windowSize = useWindowObserver();
    /** Current state of screen title, displays the screen title */
    const [screenTitle, setScreenTitle] = useState<string>("");
    /** Reference for profile menu element */
    const profileRef = useRef<Menubar>(null);
    /** Reference for logo container element*/
    const menuLogoRef = useRef<HTMLDivElement>(null);
    /** Reference for logo container when devicemode is mini */
    const menuLogoMiniRef = useRef<HTMLDivElement>(null);
    /** Reference for fadeout element when menu is collapsed */
    const fadeRef = useRef<HTMLDivElement>(null);
    /** Current logged in user */
    const currUser = context.contentStore.currentUser;
    /** Current state of translations */
    const translations = useTranslation()
    /** a reference to the current panelmenu reactelement */
    const panelMenu = useRef<PanelMenu>(null);
    /** get menu items */
    const menuItems = useMenuItems((primeMenu) => {
        //TODO in the latest primereact version the expanded state can be set via the menu model.
        //XXX tried using expanded prop -> doesn't seem to work in our case
        panelMenu.current?.setState({activeItem: primeMenu.find(m => m.label === panelMenu.current?.state.activeItem?.label)});
    })

    /**
     * Triggers a click on an opened menu panel to close it, 
     * when hovering out of expanded menu, closing expanded menu, collapsing menu etc.
     */
    const closeOpenedMenuPanel = useCallback(() => {
        if (props.forwardedRef.current.querySelector('.p-highlight > .p-panelmenu-header-link') !== null)
            props.forwardedRef.current.querySelector('.p-highlight > .p-panelmenu-header-link').click();
    },[props.forwardedRef])

    /** 
     * The menu subscribes to the screen name, so everytime the screen name changes the state of the menu screen title,
     * will get updated.
     *  @returns unsubscribing from the screen name on unmounting
     */
    useEffect(() => {
        context.subscriptions.subscribeToScreenName('x', (appName:string) => {
            setScreenTitle(appName)
        });

        return () => {
            context.subscriptions.unsubscribeFromScreenName('x');
        }
    },[context.subscriptions]);

    /**
     * Builds the profile menu
     * @returns the profile menu
     */
    const profileMenu = useMemo(() => {
        /** removes authKey from local storage, resets contentstore and sends logoutRequest to server */
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
                            label: translations.get("Logout"),
                            icon: "pi pi-power-off",
                            command(e:MenuItemCommandParams) {
                                sendLogout()
                            }
                        }
                    ]
                }
            ]

        return(
            <div className="profile-menu">
                <Menubar
                    ref={profileRef}
                    model={slideOptions}/>
            </div>
        )
    },[profileRef, currUser, context.server, context.contentStore, translations]);

    /** Sets the image of the profile-image element to the profileImage of the current user */
    useEffect(() => {
        if (document.querySelector('.profile-image') && context.contentStore.currentUser.profileImage)
            (document.querySelector('.profile-image') as HTMLElement).style.setProperty('background-image', "url(data:image/jpeg;base64,"+ context.contentStore.currentUser.profileImage + ')');
    },[profileMenu, context.contentStore.currentUser.profileImage]);

    /** Handling if menu is collapsed or expanded based on windowsize */
    useEffect(() => {
            if (!context.contentStore.menuModeAuto) {
                context.contentStore.setMenuModeAuto(true)
            }
            else {
                if (!windowSize) {
                    closeOpenedMenuPanel();
                    context.subscriptions.emitMenuCollapse(0);
                }
                    
                else
                    context.subscriptions.emitMenuCollapse(1);
            }
    },[context.contentStore, context.subscriptions, windowSize])

    /**
     * Adds eventlisteners for mouse hovering and mouse leaving. When the menu is collapsed and the mouse is hovered,
     * the menu expands, the logo switches to the big logo and fadeout div display is set to none. On leaving menu 
     * collapses, logo is small and fadeout is displayed.
     * @returns removing eventlisteners on unmount
     */
    useEffect(() => {
        const testRef = document.getElementsByClassName("menu")[0] as HTMLElement;
        if (props.forwardedRef.current) {
            const menuRef = props.forwardedRef.current;
            const hoverExpand = () => {
                if (testRef.classList.contains("menu-collapsed")) {
                    testRef.classList.remove("menu-collapsed");
                    if (menuLogoRef.current && fadeRef.current && menuLogoMiniRef.current) {
                        (menuLogoRef.current.children[0] as HTMLImageElement).src = (process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.contentStore.LOGO_BIG;
                        (menuLogoMiniRef.current.children[0] as HTMLImageElement).src = (process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.contentStore.LOGO_BIG;
                        fadeRef.current.style.setProperty('display', 'none');
                    }
                }
            }
            const hoverCollapse = () => {
                if (!testRef.classList.contains("menu-collapsed")) {
                    testRef.classList.add("menu-collapsed");
                    if (menuLogoRef.current && fadeRef.current && menuLogoMiniRef.current) {
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
    },[menuCollapsed, props.forwardedRef, context.contentStore.LOGO_BIG, context.contentStore.LOGO_SMALL, closeOpenedMenuPanel]);

    /** 
     * Handles the click on the menu-toggler. It closes a currently opened panel and switches
     * menuModeAuto which means, if true the menu will collapse/expand based on window size if
     * false the menu will be locked in its position.
     * It also notifies the contentstore that the menu has been collapsed
     */
    const handleToggleClick = () => {
        closeOpenedMenuPanel();
        context.contentStore.setMenuModeAuto(!context.contentStore.menuModeAuto)
        context.subscriptions.emitMenuCollapse(2);
    }

    return(
        <div className={concatClassnames(
            "menu",
            menuCollapsed ? " menu-collapsed" : "",
            props.showMenuMini ? "" : "no-mini"
        )}>
            <div className={"menu-topbar"}>
                <div className="menu-logo-wrapper" ref={menuLogoRef}>
                    <img className="menu-logo" src={(process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + (menuCollapsed ? context.contentStore.LOGO_SMALL : context.contentStore.LOGO_BIG)} alt="logo" />
                </div>
                <div className="menu-upper">
                    <i onClick={handleToggleClick} className="menu-toggler pi pi-bars" />
                    <span className="menu-screen-title">{screenTitle}</span>
                    {profileMenu}
                </div>
            </div>
            <div ref={props.forwardedRef} className="menu-panelmenu-wrapper">
                <div className="menu-logo-mini-wrapper" ref={menuLogoMiniRef}>
                    <img className="menu-logo-mini" src={(process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + (menuCollapsed ? context.contentStore.LOGO_SMALL : context.contentStore.LOGO_BIG)} alt="logo" />
                </div>
                <PanelMenu model={menuItems} ref={panelMenu} />
                {menuCollapsed && <div className="fadeout" ref={fadeRef}></div>}
            </div>
        </div>
    )
}
export default Menu;