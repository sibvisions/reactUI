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

import React, { CSSProperties, FC, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { PanelMenu } from 'primereact/panelmenu';
import { Menubar } from 'primereact/menubar';
import { useHistory } from "react-router";
import { Button } from "primereact/button";
import { MenuItem } from "primereact/menuitem";
import { AppContextType, appContext } from "../../main/contexts/AppProvider";
import { IForwardRef } from "../../main/IForwardRef";
import { createCloseScreenRequest, createReloadRequest, createRollbackRequest, createSaveRequest } from "../../main/factories/RequestFactory";
import { showTopBar } from "../../main/components/topbar/TopBar";
import { MenuOptions, VisibleButtons } from "../../main/AppSettings";
import ContentStore from "../../main/contentstore/ContentStore";
import Server from "../../main/server/Server";
import { EmbeddedContext } from "../../main/contexts/EmbedProvider";
import useProfileMenuItems from "../../main/hooks/data-hooks/useProfileMenuItems";
import useMenuCollapser from "../../main/hooks/event-hooks/useMenuCollapser";
import useDeviceStatus from "../../main/hooks/event-hooks/useDeviceStatus";
import useMenuItems from "../../main/hooks/data-hooks/useMenuItems";
import useEventHandler from "../../main/hooks/event-hooks/useEventHandler";
import { concatClassnames } from "../../main/util/string-util/ConcatClassnames";
import REQUEST_KEYWORDS from "../../main/request/REQUEST_KEYWORDS";
import { ActiveScreen } from "../../main/contentstore/BaseContentStore";
import { translation } from "../../main/util/other-util/Translation";
import RESPONSE_NAMES from "../../main/response/RESPONSE_NAMES";


/** Extends the PrimeReact MenuItem with componentId */
export interface MenuItemCustom extends MenuItem {
    componentId:string
    screenClassName:string,
    secondIdentifier: string
}

/** Interface for menu */
export interface IMenu extends IForwardRef {
    showMenuMini?:boolean,
    menuOptions:MenuOptions,
    screenTitle: string
}

/** Interface for profile-menu */
interface IProfileMenu {
    showButtons?: boolean,
    visibleButtons?: VisibleButtons,
}

/**
 * Returns the id of the selected menuitem based on the activescreens
 * @param activeScreens - the currently active screens
 * @param context - the app context
 */
export function getSelectedMenuItemId(activeScreens: ActiveScreen[], context: AppContextType) {
    let foundMenuItem: string = "";
    if (activeScreens.length) {
        if (context.transferType === "partial") {
            // Go through the activescreens from the back and check if the active-screen has a menu-item if yes make it the selected-item
            for (let i = activeScreens.length - 1; i >= 0; i--) {
                if (foundMenuItem) {
                    break;
                }
                else {
                    context.contentStore.menuItems.forEach(items => {
                        if (items.length) {
                            const foundItems = items.filter(item => item.className === activeScreens[i].className);
                            if (foundItems.length === 1) {
                                if (foundItems[0].className) {
                                    foundMenuItem = foundItems[0].className
                                }
                            }
                            else {
                                // find the correct item by the navigationname because if there are multiple screens with the same classname
                                // the navigationname is also used to identify the correct menuitem
                                const foundItem = foundItems.find(foundItem => foundItem.navigationName === activeScreens[i].navigationName);
                                if (foundItem && foundItem.className && foundItem.navigationName) {
                                    foundMenuItem = foundItem.className + "____" + foundItem.navigationName
                                }
                            }
                        }
                    })
                }
            }
        }

        // If there was no menu-item found through the loop, just take the last active-screen
        if (!foundMenuItem) {
            foundMenuItem = activeScreens.slice(-1).pop()!.className as string
        }
    }

    return foundMenuItem
}

/**
 * Recursively searches the menuitems for the selected menuitem. Returns the menuItem or null if not found
 * @param items - the menuitems
 * @param selectedMenuItem - the identifier string of the selected menuitem
 */
export function getSelectedMenuItem(items: MenuItem[], selectedId: string):MenuItem|null {
    let foundMenuItem:MenuItem|null = null;
    if (items) {
        for (let i = 0; i < items.length; i++) {
            // If the item has subitems recursively search for the selected menuitem
            if (items[i].items) {
                foundMenuItem = getSelectedMenuItem(items[i].items as MenuItem[], selectedId);
            }
            else {
                // There are cases where multiple menuItems have the same screenClassName, if that is the case, the selected menuitem identifier
                // will include the classname and the navigationname concatinated with "____"
                if ((items[i] as MenuItemCustom).screenClassName === selectedId) {
                    return items[i];
                }
                else if (selectedId.includes("____")) {
                    if ((items[i] as MenuItemCustom).secondIdentifier === selectedId) {
                        return items[i]
                    }
                }
            }  

            if (foundMenuItem !== null) {
                break;
            }
        }
    }
    return foundMenuItem;
}

/**
 * Renders the profile-menu and also the buttons (home, save, reload) next to the profile-menu.
 * @param props - properties, if the buttons are visible
 */
export const ProfileMenu:FC<IProfileMenu> = (props) => {
    /** Returns utility variables */
    const context = useContext(appContext);

    /** State of button-visibility */
    const [visibleButtons, setVisibleButtons] = useState<VisibleButtons>(context.appSettings.visibleButtons);

    /** State of the menuOptions, eg. foldOnCollapse */
    const [menuOptions, setMenuOptions] = useState<MenuOptions>(context.appSettings.menuOptions);

    /** The profile-menu options */
    const profileMenu = useProfileMenuItems(menuOptions.logout, menuOptions.userRestart);

    // Subscribes to the menu-visibility and the visible-buttons displayed in the profile-menu
    useEffect(() => {
        context.subscriptions.subscribeToAppSettings((menuOptions:MenuOptions, visibleButtons:VisibleButtons) => {
            setMenuOptions(menuOptions)

            setVisibleButtons(visibleButtons);
        });

        return () => {
            context.subscriptions.unsubscribeFromAppSettings((menuOptions:MenuOptions, visibleButtons:VisibleButtons) => {
                setMenuOptions(menuOptions)
                setVisibleButtons(visibleButtons);
            });
        }
    }, [context.subscriptions])
    
    return (
        <>
            {props.showButtons && visibleButtons.home && <Button
                icon="fas fa-home"
                className="menu-topbar-buttons"
                onClick={() => {
                    const getCloseScreenRequest = (screenName: string) => {
                        const closeReq = createCloseScreenRequest();
                        closeReq.componentId = screenName;
                        return closeReq;
                    }

                    // If there are inactive screens (new screen gets opened and old screen is not closed by the server), 
                    // close all inactive screens and remove them from the list.
                    if (context.contentStore.inactiveScreens.length) {
                        context.contentStore.inactiveScreens.forEach(inactiveScreen => {
                            const closeReq = getCloseScreenRequest(inactiveScreen);
                            context.server.sendRequest(closeReq, REQUEST_KEYWORDS.CLOSE_SCREEN).then((res) => {
                                if (res[0] === undefined || res[0].name !== RESPONSE_NAMES.ERROR) {
                                    context.contentStore.inactiveScreens = context.contentStore.inactiveScreens.filter(inactiveScreen2 => inactiveScreen2 !== inactiveScreen);
                                }
                            });
                        });
                    }

                    // If a screen is opened, close it, and redirect to home
                    if (context.contentStore.activeScreens.length) {
                        context.server.homeButtonPressed = true;

                        if (!context.contentStore.customScreens.has(context.contentStore.activeScreens[0].name)) {
                            const screenName = context.contentStore.activeScreens[0].name;
                            const screenId = context.contentStore.getComponentByName(screenName)?.id as string
                            const closeReq = getCloseScreenRequest(screenName);
                            showTopBar(context.server.sendRequest(closeReq, REQUEST_KEYWORDS.CLOSE_SCREEN), context.server.topbar).then((res) => {
                                // If response is empty or there is no error close the current screen and open home
                                if (res[0] === undefined || res[0].name !== RESPONSE_NAMES.ERROR) {
                                    (context.server as Server).lastClosedWasPopUp = false;
                                    context.contentStore.closeScreen(screenId, screenName, false);
                                    // If there is a homeScreen don't route to home
                                    if (!context.appSettings.homeScreen) {
                                        showTopBar((context.server as Server).routeToHome(), context.server.topbar);
                                    }
                                }
                            });
                        }
                        else {
                            showTopBar((context.server as Server).routeToHome(), context.server.topbar);
                        }
                    }
                }}
                tooltip="Home"
                tooltipOptions={{ style: { opacity: "0.85" }, position:"bottom", mouseTrack: true, mouseTrackTop: 30 }} />
            }
            {props.showButtons && (!visibleButtons || visibleButtons.save) && <Button
                icon="fas fa-save"
                className="menu-topbar-buttons"
                onClick={() => showTopBar(context.server.sendRequest(createSaveRequest(), REQUEST_KEYWORDS.SAVE), context.server.topbar)}
                tooltip={translation.get("Save")}
                tooltipOptions={{ style: { opacity: "0.85" }, position:"bottom", mouseTrack: true, mouseTrackTop: 30 }} />}
            {(!visibleButtons || (visibleButtons.reload || visibleButtons.rollback) && props.showButtons) &&
                <Button
                    icon={!visibleButtons ? "fas fa-sync" : visibleButtons.reload && !visibleButtons.rollback ? "fas fa-sync" : "pi pi-undo"}
                    className="menu-topbar-buttons"
                    onClick={() => {
                        if (!visibleButtons || (visibleButtons.reload && !visibleButtons.rollback)) {
                            showTopBar(context.server.sendRequest(createReloadRequest(), REQUEST_KEYWORDS.RELOAD), context.server.topbar)
                        }
                        else {
                            showTopBar(context.server.sendRequest(createRollbackRequest(), REQUEST_KEYWORDS.ROLLBACK), context.server.topbar)
                        }
                    }}
                    tooltip={translation.get(!visibleButtons ? "Reload" : visibleButtons.reload && !visibleButtons.rollback ? "Reload" : "Rollback")}
                    tooltipOptions={{ style: { opacity: "0.85" }, position:"bottom", mouseTrack: true, mouseTrackTop: 30 }} /> }
            {props.showButtons && menuOptions.userSettings && <div className="vl" />}
            {menuOptions.userSettings && <div className="profile-menu">
                <Menubar
                    className="profile-menubar"
                    style={(context.contentStore as ContentStore).currentUser.profileImage ? { "--profileImage": `url(data:image/jpeg;base64,${(context.contentStore as ContentStore).currentUser.profileImage})` } as CSSProperties : {}}
                    model={profileMenu} />
            </div>}
        </>
    )
}

/**
 * Menu component builds and displays the menu for reactUI, consists of a topbar with a profile-menu and a sidebar with panel-menu.
 * @param props - the properties the menu receives from the UIManager.
 */
const Menu: FC<IMenu> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** True, if the application is embedded, then don't display the menu */
    const embeddedContext = useContext(EmbeddedContext);

    /** Flag if the menu is collpased or expanded */
    const menuCollapsed = useMenuCollapser('menu');

    /** The current state of device-status */
    const deviceStatus = useDeviceStatus();

    /** Reference for logo container element*/
    const menuLogoRef = useRef<HTMLDivElement>(null);

    /** Reference for logo container when devicemode is mini */
    const menuLogoMiniRef = useRef<HTMLDivElement>(null);

    /** Reference for fadeout element when menu is collapsed */
    const fadeRef = useRef<HTMLDivElement>(null);

    /** a reference to the current panelmenu reactelement */
    const panelMenu = useRef<PanelMenu>(null);

    /** True, if the menu should close on collapse */
    const foldMenuOnCollapse = useMemo(() => context.appSettings.menuOptions.foldMenuOnCollapse, [context.appSettings.menuOptions]);

    /** State of the active-screens */
    const [activeScreens, setActiveScreens] = useState<ActiveScreen[]>(context.contentStore.activeScreens);

    /** State of the currently expanded menu-items */
    const [expandedKeys, setExpandedKeys] = useState<any>({});

    /** get menu items */
    const menuItems = useMenuItems();

    // Subscribes to the active-screens
    useLayoutEffect(() => {
        context.subscriptions.subscribeToActiveScreens("menu", (activeScreens:ActiveScreen[]) => setActiveScreens([...activeScreens]));

        return () => context.subscriptions.unsubscribeFromActiveScreens("menu")
    },[context.subscriptions])

    /** The current selected menu-item's id based on the active-screen */ 
    const selectedMenuItemId = useMemo(() => getSelectedMenuItemId(activeScreens, context), [activeScreens])

    /**
     * Triggers a click on an opened menu panel to close it, 
     * when hovering out of expanded menu, closing expanded menu, collapsing menu etc.
     */
    const closeOpenedMenuPanel = useCallback(() => {
        if (props.menuOptions.menuBar) {
            const highlightElem = props.forwardedRef.current.querySelector('.p-highlight');
            const childElem = props.forwardedRef.current.querySelector('.p-highlight > .p-panelmenu-header-link');
            if (childElem !== null && highlightElem !== null && (highlightElem as HTMLElement).parentElement !== null && !(highlightElem as HTMLElement).parentElement!.classList.contains("single-group-item")) {
                childElem.scrollTop = 0;
                childElem.querySelector('.p-highlight > .p-panelmenu-header-link').click();
            }
        }
    },[props.forwardedRef])

    /** Handling if menu is collapsed or expanded based on windowsize */
    useEffect(() => {
        if (props.menuOptions.menuBar) {
            if (!context.appSettings.menuModeAuto) {
                context.appSettings.setMenuModeAuto(true)
            }
            else {
                if (deviceStatus === "Small" || deviceStatus === "Mini") {
                    if (foldMenuOnCollapse) {
                        closeOpenedMenuPanel();
                    }
                    context.subscriptions.emitMenuCollapse(0);
                }
                else {
                    context.subscriptions.emitMenuCollapse(1);
                }
            }
        }
    }, [context.contentStore, context.subscriptions, deviceStatus]);

    // Extends the panel-menu based on the selected menu-item
    useEffect(() => {
        if (props.menuOptions.menuBar) {
            if (menuItems) {
                const foundMenuItem:MenuItem|null = getSelectedMenuItem(menuItems, selectedMenuItemId);
                if (foundMenuItem && foundMenuItem.id) {
                    const splitId = foundMenuItem.id.split("/");
                    const newExpandedKeys:any = {};
                    splitId.forEach((key, i) => {
                        let expandKey = splitId.slice(0, i + 1).join("/");
                        // removes unique id from key
                        if (expandKey.includes("____")) {
                            expandKey = expandKey.substring(0, expandKey.indexOf("_"));
                        }
                        newExpandedKeys[expandKey] = true
                    });
                    setExpandedKeys(newExpandedKeys);
                }

                // TODO there seems to be a new property for panelmenu "expandedKeys" which is not available yet but will be in the future
                // https://github.com/primefaces/primereact/blob/master/components/doc/panelmenu/controlleddoc.js
                // if (foundMenuItem && !panelMenu.current?.state.activeItem) {
                //     panelMenu.current?.setState({ activeItem: foundMenuItem });
                // }
                // else if ((foundMenuItem && panelMenu.current?.state.activeItem) && foundMenuItem.label && foundMenuItem.label !== panelMenu.current.state.activeItem.label) {
                //     panelMenu.current?.setState({ activeItem: foundMenuItem });
                // }
                //panelMenu.current?.setState({ activeItem: foundMenuItem });
            }
        }

    }, [selectedMenuItemId, menuItems])

    /**
     * Adds eventlisteners for mouse hovering and mouse leaving. When the menu is collapsed and the mouse is hovered,
     * the menu expands, the logo switches to the big logo and fadeout div display is set to none. On leaving menu 
     * collapses, logo is small and fadeout is displayed.
     * @returns removing eventlisteners on unmount
     */
    useEffect(() => {
        if (props.menuOptions.menuBar) {
            const menuOuter = document.getElementsByClassName("std-menu")[0] as HTMLElement;
            if (props.forwardedRef.current) {
                const menuRef = props.forwardedRef.current;
                const hoverExpand = () => {
                    if (menuOuter.classList.contains("menu-collapsed")) {
                        menuOuter.classList.remove("menu-collapsed");
                        if (menuLogoRef.current && fadeRef.current && menuLogoMiniRef.current) {
                            (menuLogoRef.current.children[0] as HTMLImageElement).src = (process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.appSettings.LOGO_BIG;
                            (menuLogoMiniRef.current.children[0] as HTMLImageElement).src = (process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.appSettings.LOGO_BIG;
                            fadeRef.current.style.setProperty('display', 'none');
                        }
                    }
                }
                const hoverCollapse = () => {
                    if (!menuOuter.classList.contains("menu-collapsed")) {
                        menuOuter.classList.add("menu-collapsed");
                        if (menuLogoRef.current && fadeRef.current && menuLogoMiniRef.current) {
                            (menuLogoRef.current.children[0] as HTMLImageElement).src = (process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.appSettings.LOGO_SMALL;
                            (menuLogoMiniRef.current.children[0] as HTMLImageElement).src = (process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.appSettings.LOGO_SMALL;
                            fadeRef.current.style.removeProperty('display');
                        }
                        if (foldMenuOnCollapse) {
                            closeOpenedMenuPanel();
                        }
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
        }

    },[menuCollapsed, props.forwardedRef, context.appSettings.LOGO_BIG, context.appSettings.LOGO_SMALL, closeOpenedMenuPanel]);

    /** When the transition of the menu-opening starts, add the classname to the element so the text of active screen is blue */
    useEventHandler(document.getElementsByClassName("p-panelmenu")[0] as HTMLElement, "transitionstart", (event) => {
        if (props.menuOptions.menuBar) {
            if ((event as any).propertyName === "max-height" && selectedMenuItemId) {
                const menuElem = document.getElementsByClassName(selectedMenuItemId)[0];
                if (menuElem && !menuElem.classList.contains("p-menuitem--active")) {
                    menuElem.classList.add("p-menuitem--active")
                }
            }
        }
    });

    /** 
     * Handles the click on the menu-toggler. It closes a currently opened panel
     * 
     * switches menuModeAuto which means, if true the menu will collapse/expand based on window size if
     * false the menu will be locked in its position. Because if we expanded the menu once,
     * we don't want it to collapse again when the window size changes.
     * 
     * It also notifies the submanager that the menu has been collapsed
     */
    const handleToggleClick = () => {
        if (props.menuOptions.menuBar) {
            if (foldMenuOnCollapse) {
                closeOpenedMenuPanel();
            }
            context.appSettings.setMenuModeAuto(!context.appSettings.menuModeAuto)
            context.subscriptions.emitMenuCollapse(2);
        }
    }

    return (
        <>
            {(props.menuOptions.menuBar && props.menuOptions.toolBar && (!embeddedContext || embeddedContext.showMenu)) &&
                <div className={concatClassnames(
                    "std-menu",
                    menuCollapsed ? " menu-collapsed" : "",
                    // if "no-mini" don't show the menu in "mini-mode"
                    props.showMenuMini ? "" : "no-mini"
                )}>
                    <div className={"menu-header"}>
                        <div className="menu-logo-wrapper" ref={menuLogoRef}>
                            <img draggable="false" className="menu-logo" src={(process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + (menuCollapsed ? context.appSettings.LOGO_SMALL : context.appSettings.LOGO_BIG)} alt="logo" />
                        </div>
                        <div className="menu-topbar">
                            <div className="menu-topbar-left">
                                <Button
                                    icon={!menuCollapsed ? "pi pi-chevron-left" : "pi pi-chevron-right"}
                                    className="menu-topbar-buttons menu-toggler"
                                    onClick={() => handleToggleClick()}
                                    style={{ marginRight: "4px", marginLeft: "10px" }} />
                                <span className="menu-screen-title">{props.screenTitle}</span>
                            </div>
                            <div className="menu-topbar-right">
                                <ProfileMenu showButtons  />
                            </div>
                        </div>
                    </div>
                    {props.menuOptions.menuBar && props.menuOptions.toolBar &&
                        <div ref={props.forwardedRef} className="menu-panelmenu-wrapper">
                            <div className="menu-logo-mini-wrapper" ref={menuLogoMiniRef}>
                                <img className="menu-logo-mini" src={(process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + (menuCollapsed ? context.appSettings.LOGO_SMALL : context.appSettings.LOGO_BIG)} alt="logo" />
                            </div>
                            {/** @ts-ignore */}
                            <PanelMenu 
                                model={menuItems} 
                                ref={panelMenu} 
                                //@ts-ignore
                                expandedKeys={expandedKeys} 
                                //@ts-ignore
                                onExpandedKeysChange={e => {
                                // Find out which item has just been expanded
                                let newExpandedItem = {...e};
                                Object.keys(newExpandedItem).forEach(key => {
                                    if (Object.keys(expandedKeys).includes(key)) {
                                        delete newExpandedItem[key];
                                    }
                                });
                                const newExpandedKeys = Object.keys(newExpandedItem);
                                const expandedKeysToSet:any = {};
                                // If we've found exactly 1 item that has been expanded, check the which parents are needed to be extended
                                // and add them to the expandedKeys object.
                                if (newExpandedKeys.length === 1) {
                                    const splitKeys = newExpandedKeys[0].split("/");
                                    splitKeys.forEach((key, i) => {
                                        expandedKeysToSet[splitKeys.slice(0, i + 1).join("/")] = true
                                    })
                                }
                                
                                setExpandedKeys(expandedKeysToSet);
                            }} />
                            {menuCollapsed && <div className="fadeout" ref={fadeRef}></div>}
                        </div>
                    }
                </div>
            }
        </>
    )
}
export default Menu;