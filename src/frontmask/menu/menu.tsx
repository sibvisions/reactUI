/** React imports */
import React, { FC, useCallback, useContext, useEffect, useRef, useState } from "react";

/** 3rd Party imports */
import { PanelMenu } from 'primereact/panelmenu';
import { Menubar } from 'primereact/menubar';
import { useHistory } from "react-router";
import { Button } from "primereact/button";
import { MenuItem } from "primereact/menuitem";

/** Hook imports */
import { useMenuCollapser, useMenuItems, useProfileMenuItems, useEventHandler, useTranslation, useDeviceStatus } from '../../main/components/zhooks'

/** Other imports */
import { appContext } from "../../main/AppProvider";
import { IForwardRef } from "../../main/IForwardRef";
//import { MenuItem } from "primereact/api";
import { concatClassnames } from "../../main/components/util";
import { createCloseScreenRequest, createReloadRequest, createRollbackRequest, createSaveRequest } from "../../main/factories/RequestFactory";
import { showTopBar, TopBarContext } from "../../main/components/topbar/TopBar";
import { REQUEST_ENDPOINTS } from "../../main/request";
import { MenuVisibility, VisibleButtons } from "../../main/AppSettings";
import { ApplicationSettingsResponse } from "../../main/response";


/** Extends the PrimeReact MenuItem with componentId */
export interface MenuItemCustom extends MenuItem {
    componentId:string
    screenClassName:string
}

interface IMenu extends IForwardRef {
    showMenuMini:boolean
}

export const ProfileMenu:FC<{showButtons?:boolean}> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    // const { 
    //     contentStore: { 
    //         currentUser: { profileImage }, 
    //         setActiveScreen,
    //         activeScreens
    //     },
    //     server: {
    //         sendRequest
    //     },
    //     subscriptions: { 
    //         emitSelectedMenuItem
    //      } 
    // } = useContext(appContext);
    const context = useContext(appContext);
    const slideOptions = useProfileMenuItems();
    /** History of react-router-dom */
    const history = useHistory();

    /** Current state of translations */
    const translations = useTranslation();

    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);

    /** State of button-visibility */
    const [visibleButtons, setVisibleButtons] = useState<VisibleButtons>(context.appSettings.visibleButtons);

    const deviceStatus = useDeviceStatus();

    useEffect(() => {
        context.subscriptions.subscribeToAppSettings((appSettings: ApplicationSettingsResponse) => {
            setVisibleButtons({
                reload: appSettings.reload,
                rollback: appSettings.rollback,
                save: appSettings.save
            })
        });

        return () => {
            context.subscriptions.unsubscribeFromAppSettings((appSettings: ApplicationSettingsResponse) => {
                setVisibleButtons({
                    reload: appSettings.reload,
                    rollback: appSettings.rollback,
                    save: appSettings.save
                })
            });
        }
    }, [context.subscriptions])
    
    return (
        <>
            {props.showButtons && <Button
                icon="fa fa-home"
                className="menu-upper-buttons"
                onClick={() => {
                    const openWelcomeOrHome = () => {
                        if (context.appSettings.welcomeScreen) {
                            return context.api.sendOpenScreenRequest(context.appSettings.welcomeScreen, undefined, true);
                        }
                        else {
                            history.push('/home');
                            return Promise.resolve(true);
                        }
                    }

                    if (context.contentStore.activeScreens.length) {
                        context.subscriptions.emitSelectedMenuItem("");
                        if (!context.contentStore.customScreens.has(context.contentStore.activeScreens[0])) {
                            const closeReq = createCloseScreenRequest();
                            closeReq.componentId = context.contentStore.activeScreens[0];
                            context.contentStore.setActiveScreen();
                            showTopBar(context.server.sendRequest(closeReq, REQUEST_ENDPOINTS.CLOSE_SCREEN), topbar).then(() => {
                                showTopBar(openWelcomeOrHome(), topbar);
                            });
                        }
                        else {
                            context.contentStore.setActiveScreen();
                            showTopBar(openWelcomeOrHome(), topbar);
                        }
                    }
                }}
                tooltip="Home"
                tooltipOptions={{ style: { opacity: "0.85" }, position: "bottom" }} />
            }
            {props.showButtons && visibleButtons.save && <Button
                icon="fa fa-save"
                className="menu-upper-buttons"
                onClick={() => showTopBar(context.server.sendRequest(createSaveRequest(), REQUEST_ENDPOINTS.SAVE), topbar)}
                tooltip={translations.get("Save")}
                tooltipOptions={{ style: { opacity: "0.85" }, position: "bottom" }} />}
            {((visibleButtons.reload || visibleButtons.rollback) && props.showButtons) &&
                <Button
                    icon={visibleButtons.reload && !visibleButtons.rollback ? "fa fa-refresh" : "pi pi-undo"}
                    className="menu-upper-buttons"
                    onClick={() => {
                        if (visibleButtons.reload && !visibleButtons.rollback) {
                            showTopBar(context.server.sendRequest(createReloadRequest(), REQUEST_ENDPOINTS.RELOAD), topbar)
                        }
                        else {
                            showTopBar(context.server.sendRequest(createRollbackRequest(), REQUEST_ENDPOINTS.ROLLBACK), topbar)
                        }
                    }}
                    tooltip={translations.get(visibleButtons.reload && !visibleButtons.rollback ? "Reload" : "Rollback")}
                    tooltipOptions={{ style: { opacity: "0.85" }, position: "bottom" }} /> }
            <div className="profile-menu">
                <Menubar
                    style={context.contentStore.currentUser.profileImage ? { "--profileImage": `url(data:image/jpeg;base64,${context.contentStore.currentUser.profileImage})` } : {}}
                    model={slideOptions} />
            </div>
        </>
    )
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

    /** The current state of device-status */
    const deviceStatus = useDeviceStatus();

    /** Current state of screen title, displays the screen title */
    const [screenTitle, setScreenTitle] = useState<string>("");

    /** Reference for logo container element*/
    const menuLogoRef = useRef<HTMLDivElement>(null);

    /** Reference for logo container when devicemode is mini */
    const menuLogoMiniRef = useRef<HTMLDivElement>(null);

    /** Reference for fadeout element when menu is collapsed */
    const fadeRef = useRef<HTMLDivElement>(null);

    /** a reference to the current panelmenu reactelement */
    const panelMenu = useRef<PanelMenu>(null);

    /** The currently selected-menuitem */
    const [selectedMenuItem, setSelectedMenuItem] = useState<string>(context.contentStore.selectedMenuItem);

    /** A flag which changes when the active item changes */
    const [activeItemChanged, setActiveItemChanged] = useState<boolean>(false);

    /** State of menu-visibility */
    const [menuVisibility, setMenuVisibility] = useState<MenuVisibility>(context.appSettings.menuVisibility);

    /** get menu items */
    const menuItems = useMenuItems()

    /**
     * Triggers a click on an opened menu panel to close it, 
     * when hovering out of expanded menu, closing expanded menu, collapsing menu etc.
     */
    const closeOpenedMenuPanel = useCallback(() => {
        if (props.forwardedRef.current.querySelector('.p-highlight > .p-panelmenu-header-link') !== null) {
            props.forwardedRef.current.scrollTop = 0;
            props.forwardedRef.current.querySelector('.p-highlight > .p-panelmenu-header-link').click();
        }
    },[props.forwardedRef])

    /** 
     * The standard-menu subscribes to the screen name, selectedMenuItem and app-settings, so everytime these properties change the state
     * will get updated.
     *  @returns unsubscribing from the screen name on unmounting
     */
    useEffect(() => {
        context.subscriptions.subscribeToScreenName('s-menu', (appName: string) => {
            setScreenTitle(appName)
        });
        context.subscriptions.subscribeToSelectedMenuItem((menuItem: string) => setSelectedMenuItem(menuItem));
        context.subscriptions.subscribeToAppSettings((appSettings: ApplicationSettingsResponse) => {
            setMenuVisibility({
                menuBar: appSettings.menuBar,
                toolBar: appSettings.toolBar
            })
        });

        return () => {
            context.subscriptions.unsubscribeFromScreenName('s-menu');
            context.subscriptions.unsubscribeFromSelectedMenuItem();
            context.subscriptions.unsubscribeFromAppSettings((appSettings: ApplicationSettingsResponse) => {
                setMenuVisibility({
                    menuBar: appSettings.menuBar,
                    toolBar: appSettings.toolBar
                })
            });
        }
    }, [context.subscriptions]);

    /** Handling if menu is collapsed or expanded based on windowsize */
    useEffect(() => {
            if (!context.appSettings.menuModeAuto) {
                context.appSettings.setMenuModeAuto(true)
            }
            else {
                if (deviceStatus === "Small" || deviceStatus === "Mini") {
                    closeOpenedMenuPanel();
                    context.subscriptions.emitMenuCollapse(0);
                }
                else
                    context.subscriptions.emitMenuCollapse(1);
            }
    },[context.contentStore, context.subscriptions, deviceStatus])

    useEffect(() => {
        if (menuItems) {
            let foundMenuItem:MenuItem = {}
            menuItems.forEach(m => {
                if ((m.items as MenuItem[]).find((item) => (item as MenuItemCustom).screenClassName === selectedMenuItem)) {
                    foundMenuItem = m
                }
            });

            if (foundMenuItem && !panelMenu.current?.state.activeItem) {
                panelMenu.current?.setState({ activeItem: foundMenuItem });
                setActiveItemChanged(prev => !prev)
            }
            else if ((foundMenuItem && panelMenu.current?.state.activeItem) && foundMenuItem.label !== panelMenu.current.state.activeItem) {
                panelMenu.current?.setState({ activeItem: foundMenuItem });
                setActiveItemChanged(prev => !prev)
            }
        }
    }, [selectedMenuItem, menuItems])

    useEffect(() => {
        Array.from(document.getElementsByClassName("p-menuitem--active")).forEach(elem => elem.classList.remove("p-menuitem--active"));
        const menuElem = document.getElementsByClassName(selectedMenuItem)[0];
        if (menuElem) {
            menuElem.classList.add("p-menuitem--active");
        } 
    },[activeItemChanged])

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
                        (menuLogoRef.current.children[0] as HTMLImageElement).src = (process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.appSettings.LOGO_BIG;
                        (menuLogoMiniRef.current.children[0] as HTMLImageElement).src = (process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.appSettings.LOGO_BIG;
                        fadeRef.current.style.setProperty('display', 'none');
                    }
                }
            }
            const hoverCollapse = () => {
                if (!testRef.classList.contains("menu-collapsed")) {
                    testRef.classList.add("menu-collapsed");
                    if (menuLogoRef.current && fadeRef.current && menuLogoMiniRef.current) {
                        (menuLogoRef.current.children[0] as HTMLImageElement).src = (process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.appSettings.LOGO_SMALL;
                        (menuLogoMiniRef.current.children[0] as HTMLImageElement).src = (process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.appSettings.LOGO_SMALL;
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
    },[menuCollapsed, props.forwardedRef, context.appSettings.LOGO_BIG, context.appSettings.LOGO_SMALL, closeOpenedMenuPanel]);

    /** When the transition of the menu-opening starts, add the classname to the element so the text of active screen is blue */
    useEventHandler(document.getElementsByClassName("p-panelmenu")[0] as HTMLElement, "transitionstart", (event) => {
        if ((event as any).propertyName === "max-height") {
            const menuElem = document.getElementsByClassName(selectedMenuItem)[0];
            if (menuElem && !menuElem.classList.contains("p-menuitem--active")) {
                menuElem.classList.add("p-menuitem--active")
            }
        }
    })

    /** 
     * Handles the click on the menu-toggler. It closes a currently opened panel and switches
     * menuModeAuto which means, if true the menu will collapse/expand based on window size if
     * false the menu will be locked in its position.
     * It also notifies the contentstore that the menu has been collapsed
     */
    const handleToggleClick = () => {
        closeOpenedMenuPanel();
        context.appSettings.setMenuModeAuto(!context.appSettings.menuModeAuto)
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
                    <img draggable="false" className="menu-logo" src={(process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + (menuCollapsed ? context.appSettings.LOGO_SMALL : context.appSettings.LOGO_BIG)} alt="logo" />
                </div>
                <div className="menu-upper">
                    <div className="menu-upper-left">
                        <Button
                            icon={!menuCollapsed ? "pi pi-chevron-left" : "pi pi-chevron-right"}
                            className="menu-upper-buttons menu-toggler"
                            onClick={() => handleToggleClick()}
                            style={{ marginRight: "4px", marginLeft: "10px" }} />
                        <span className="menu-screen-title">{screenTitle}</span>
                    </div>
                    <div className="menu-upper-right">
                        <ProfileMenu showButtons />
                    </div>
                </div>
            </div>
            {menuVisibility.menuBar &&
                <div ref={props.forwardedRef} className="menu-panelmenu-wrapper">
                    <div className="menu-logo-mini-wrapper" ref={menuLogoMiniRef}>
                        <img className="menu-logo-mini" src={(process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + (menuCollapsed ? context.appSettings.LOGO_SMALL : context.appSettings.LOGO_BIG)} alt="logo" />
                    </div>
                    <PanelMenu model={menuItems} ref={panelMenu} />
                    {menuCollapsed && <div className="fadeout" ref={fadeRef}></div>}
                </div>
            }
        </div>
    )
}
export default Menu;