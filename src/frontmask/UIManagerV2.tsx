import React, { FC, useContext, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { MenuVisibility, VisibleButtons } from "../main/AppSettings";
import { concatClassnames } from "../main/components/util";
import { ApplicationSettingsResponse } from "../main/response";
import { appContext, useDeviceStatus } from "../moduleIndex";
import ChangePasswordDialog from "./changePassword/ChangePasswordDialog";
import ScreenManager from "./ScreenManager";
import { isCorporation, IUIManagerProps, ResizeContext } from "./UIManager";

const UIManagerV2: FC<IUIManagerProps> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** State of menu-visibility */
    const [menuVisibility, setMenuVisibility] = useState<MenuVisibility>(context.appSettings.menuVisibility);

    /** State of button-visibility */
    const [visibleButtons, setVisibleButtons] = useState<VisibleButtons>(context.appSettings.visibleButtons);

    /** True, if the session is expired */
    const [sessionExpired, setSessionExpired] = useState<boolean>(false);

    /** True, if the standard menu for mobile is active IF corporation applayout is set */
    const [mobileStandard, setMobileStandard] = useState<boolean>(false);

    /** The currently used app-layout */
    const appLayout = useMemo(() => context.appSettings.applicationMetaData.applicationLayout.layout, [context.appSettings.applicationMetaData]);

    /** ComponentId of Screen extracted by useParams hook */
    const { componentId } = useParams<any>();

    /** The current state of device-status */
    const deviceStatus = useDeviceStatus();

    const [appTheme, setAppTheme] = useState<string>(context.appSettings.applicationMetaData.applicationTheme.value);

    useEffect(() => {
        context.subscriptions.subscribeToAppSettings((appSettings: ApplicationSettingsResponse) => {
            setMenuVisibility({
                menuBar: appSettings.menuBar,
                toolBar: appSettings.toolBar
            });

            setVisibleButtons({
                reload: appSettings.reload,
                rollback: appSettings.rollback,
                save: appSettings.save
            });
        });

        context.subscriptions.subscribeToErrorDialog((show:boolean) => setSessionExpired(show));

        context.subscriptions.subscribeToTheme("uimanager", (theme:string) => setAppTheme(theme));

        return () => {
            context.subscriptions.unsubscribeFromAppSettings((appSettings: ApplicationSettingsResponse) => {
                setMenuVisibility({
                    menuBar: appSettings.menuBar,
                    toolBar: appSettings.toolBar
                });

                setVisibleButtons({
                    reload: appSettings.reload,
                    rollback: appSettings.rollback,
                    save: appSettings.save
                });
            });
            context.subscriptions.unsubscribeFromErrorDialog((show:boolean) => setSessionExpired(show));
            context.subscriptions.unsubscribeFromTheme("uimanager");
        }
    }, [context.subscriptions]);

    return (
        <div className={concatClassnames(
            "reactUI",
            isCorporation(appLayout, appTheme) ? "corporation" : "",
            sessionExpired ? "reactUI-expired" : "",
            appTheme
        )}>
            <ChangePasswordDialog loggedIn username={context.contentStore.currentUser.userName} password="" />
            <div id="reactUI-main" className={concatClassnames(
                    "main",
                    menuVisibility.toolBar ? "toolbar-visible" : "",
                    !menuVisibility.menuBar ? "menu-not-visible" : "",
                )}>
                    <ResizeContext.Provider value={{ login: false, mobileStandard: mobileStandard, setMobileStandard: (active:boolean) => setMobileStandard(active) }}>
                        <ScreenManager />
                    </ResizeContext.Provider>
                </div>
        </div>
    )
}
export default UIManagerV2