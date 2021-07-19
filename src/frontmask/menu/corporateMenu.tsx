/** React imports */
import React, { FC, useContext, useEffect, useState } from "react";

/** 3rd Party imports */
import { Menubar } from 'primereact/menubar';
import { Menu } from 'primereact/menu'

/** Hook imports */
import { useMenuItems } from "../../main/components/zhooks";

/** Other imports */
import { appContext } from "../../main/AppProvider";
import { ProfileMenu } from "./menu";
import { MenuVisibility, VisibleButtons } from "../../main/AppSettings";
import { ApplicationSettingsResponse } from "../../main/response";



const CorporateMenu:FC = () => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Current state of screen title, displays the screen title */
    const [screenTitle, setScreenTitle] = useState<string>("");

    /** State of button-visibility */
    const [visibleButtons, setVisibleButtons] = useState<VisibleButtons>(context.appSettings.visibleButtons);

    /** State of menu-visibility */
    const [menuVisibility, setMenuVisibility] = useState<MenuVisibility>(context.appSettings.menuVisibility);

    /** get menu items */
    const menuItems = useMenuItems();

    const testItems = [
        {
            items: [
                {label: "First", icon: "fa fa-arrow-right"},
                {label: "Second", icon: "fa fa-arrow-left"}
            ]
        }
    ]

    /** 
     * The corporate-menu subscribes to the screen name and app-settings, so everytime these properties change the state
     * will get updated.
     *  @returns unsubscribing from the screen name on unmounting
     */
    useEffect(() => {
        context.subscriptions.subscribeToScreenName('c-menu', (appName: string) => setScreenTitle(appName));
        context.subscriptions.subscribeToAppSettings((appSettings: ApplicationSettingsResponse) => {
            setVisibleButtons({
                reload: appSettings.reload,
                rollback: appSettings.rollback,
                save: appSettings.save
            });
            setMenuVisibility({
                menuBar: appSettings.menuBar,
                toolBar: appSettings.toolBar
            })
        });

        return () => {
            context.subscriptions.unsubscribeFromScreenName('c-menu');
            context.subscriptions.unsubscribeFromAppSettings((appSettings: ApplicationSettingsResponse) => {
                setVisibleButtons({
                    reload: appSettings.reload,
                    rollback: appSettings.rollback,
                    save: appSettings.save
                });
                setMenuVisibility({
                    menuBar: appSettings.menuBar,
                    toolBar: appSettings.toolBar
                })
            });
        }
    }, [context.subscriptions]);

    return (
        <div className="c-menu">
            <div className="c-menu-topbar">
                <div className="c-menu-header"> 
                    <div className="c-menu-logo-wrapper">
                        <img className="menu-logo" src={(process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.appSettings.LOGO_BIG} alt="logo" />
                    </div>
                    <span className="menu-screen-title">{screenTitle}</span>
                    <div className="c-menu-profile">
                        <ProfileMenu visibleButtons={visibleButtons} />
                    </div>
                </div>
                <div className="c-menu-menubar">
                    <Menubar model={menuItems} />
                </div>
            </div>
            <div className="c-menu-quicknav-wrapper">
                <Menu model={testItems} />
            </div>
        </div>
    )
}
export default CorporateMenu