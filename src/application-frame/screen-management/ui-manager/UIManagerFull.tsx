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

import React, { FC, useContext, useEffect, useMemo, useState } from "react";
import { appContext } from "../../../main/AppProvider";
import { MenuOptions, VisibleButtons } from "../../../main/AppSettings";
import { concatClassnames } from "../../../main/util";
import ScreenManager from "../ScreenManager";
import { isCorporation, ResizeContext } from "./UIManager";

const UIManagerFull: FC<any> = () => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** State of menu-visibility */
    const [menuOptions, setMenuOptions] = useState<MenuOptions>(context.appSettings.menuOptions);

    /** True, if the standard menu for mobile is active IF corporation applayout is set */
    const [mobileStandard, setMobileStandard] = useState<boolean>(false);

    /** The currently used app-layout */
    const appLayout = useMemo(() => context.appSettings.applicationMetaData.applicationLayout.layout, [context.appSettings.applicationMetaData]);

    const [appTheme, setAppTheme] = useState<string>(context.appSettings.applicationMetaData.applicationTheme.value);

    useEffect(() => {
        context.subscriptions.subscribeToAppSettings((menuOptions:MenuOptions, visibleButtons:VisibleButtons, changePWEnabled: boolean) => {
            setMenuOptions(menuOptions);
        });

        context.subscriptions.subscribeToTheme("uimanager", (theme:string) => setAppTheme(theme));

        return () => {
            context.subscriptions.unsubscribeFromAppSettings((menuOptions:MenuOptions, visibleButtons:VisibleButtons, changePWEnabled: boolean) => {
                setMenuOptions(menuOptions);
            });
            context.subscriptions.unsubscribeFromTheme("uimanager");
        }
    }, [context.subscriptions]);

    return (
        <div className={concatClassnames(
            "reactUI",
            isCorporation(appLayout, appTheme) ? "corporation" : "",
            appTheme
        )}>
            <div id="reactUI-main" className={concatClassnames(
                    "main",
                    menuOptions.toolBar ? "toolbar-visible" : "",
                    !menuOptions.menuBar ? "menu-not-visible" : "",
                )}>
                    <ResizeContext.Provider value={{ login: false, mobileStandard: mobileStandard, setMobileStandard: (active:boolean) => setMobileStandard(active) }}>
                        <ScreenManager />
                    </ResizeContext.Provider>
                </div>
        </div>
    )
}
export default UIManagerFull