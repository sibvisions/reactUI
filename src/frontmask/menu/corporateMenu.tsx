/** React imports */
import React, { FC, useCallback, useContext, useEffect, useState } from "react";

/** 3rd Party imports */
import { Menubar } from 'primereact/menubar';
import { SpeedDial } from "primereact/speeddial";
import { Tooltip } from 'primereact/tooltip'
import { MenuItem } from "primereact/menuitem";

/** Hook imports */
import { useConstants, useMenuItems, useScreenTitle } from "../../main/components/zhooks";

/** Other imports */
import { IMenu, ProfileMenu } from "./menu";
import { BaseMenuButton } from "../../main/response";
import { parseIconData } from "../../main/components/compprops";
import { showTopBar } from "../../main/components/topbar/TopBar";
import { EmbeddedContext } from "../../MiddleMan";



const CorporateMenu:FC<IMenu> = (props) => {
    /** Returns utility variables */
    const [context, topbar] = useConstants();

    const embeddedContext = useContext(EmbeddedContext);

    /** Current state of screen title, displays the screen title */
    const screenTitle = useScreenTitle();

    /** get menu items */
    const menuItems = useMenuItems();

    const handleNewToolbarItems = useCallback((toolbarItems: Array<MenuItem>) => {
        const tbItems = new Array<MenuItem>();
        toolbarItems.forEach(item => {
            const iconData = parseIconData(undefined, item.image)
            const toolbarItem:MenuItem = {
                label: item.text,
                icon: iconData.icon,
                command: () => showTopBar(item.action(), topbar)
            }
            tbItems.push(toolbarItem);
        });
        return tbItems
    }, [topbar])

    /** State of the toolbar-items */
    const [toolbarItems, setToolbarItems] = useState<Array<MenuItem>>(handleNewToolbarItems(context.contentStore.toolbarItems));

    /** 
     * The corporate-menu subscribes to the screen name and app-settings, so everytime these properties change the state
     * will get updated.
     *  @returns unsubscribing from the screen name on unmounting
     */
    useEffect(() => {
        context.subscriptions.subscribeToToolBarItems((toolBarItems:Array<BaseMenuButton>) => setToolbarItems(handleNewToolbarItems(toolBarItems)));

        return () => context.subscriptions.unsubscribeFromToolBarItems((toolBarItems:Array<BaseMenuButton>) => setToolbarItems(handleNewToolbarItems(toolBarItems)));
    }, [context.subscriptions]);

    return (
        <>
            {(!embeddedContext) &&
                <div className="corp-menu">
                    <div className="corp-menu-topbar">
                        <div className="corp-menu-header">
                            <div className="corp-menu-logo-wrapper">
                                <img
                                    className="menu-logo"
                                    draggable="false"
                                    src={(process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.appSettings.LOGO_BIG} alt="logo" />
                            </div>
                            <span className="menu-screen-title">{screenTitle}</span>
                            <div className="corp-menu-profile">
                                <ProfileMenu showButtons visibleButtons={props.visibleButtons} />
                            </div>
                        </div>
                        {props.menuVisibility.menuBar &&
                            <div className="corp-menu-menubar">
                                {props.menuVisibility.toolBar && toolbarItems && toolbarItems.length > 0 &&
                                    <div style={{ maxHeight: "32px", minWidth: "32px" }}>
                                        <Tooltip target=".p-speeddial-linear .p-speeddial-action" position="right" />
                                        <SpeedDial model={toolbarItems} direction="down" />
                                    </div>
                                }
                                <Menubar model={menuItems} />
                            </div>
                        }
                    </div>
                </div>
            }
        </>
    )
}
export default CorporateMenu