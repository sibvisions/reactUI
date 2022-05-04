import React, { FC, useContext, useEffect, useMemo, useState } from "react";
import { appContext } from "../../../main/AppProvider";
import { MenuVisibility, VisibleButtons } from "../../../main/AppSettings";
import { concatClassnames } from "../../../main/util";
import { ApplicationSettingsResponse } from "../../../main/response";
import ScreenManager from "../ScreenManager";
import { isCorporation, ResizeContext } from "./UIManager";

const UIManagerV2: FC<any> = () => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** State of menu-visibility */
    const [menuVisibility, setMenuVisibility] = useState<MenuVisibility>(context.appSettings.menuVisibility);

    /** True, if the session is expired */
    const [sessionExpired, setSessionExpired] = useState<boolean>(false);

    /** True, if the standard menu for mobile is active IF corporation applayout is set */
    const [mobileStandard, setMobileStandard] = useState<boolean>(false);

    /** The currently used app-layout */
    const appLayout = useMemo(() => context.appSettings.applicationMetaData.applicationLayout.layout, [context.appSettings.applicationMetaData]);

    const [appTheme, setAppTheme] = useState<string>(context.appSettings.applicationMetaData.applicationTheme.value);

    useEffect(() => {
        context.subscriptions.subscribeToAppSettings((menuVisibility:MenuVisibility, visibleButtons:VisibleButtons, changePWEnabled: boolean) => {
            setMenuVisibility({
                menuBar: menuVisibility.menuBar,
                toolBar: menuVisibility.toolBar
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