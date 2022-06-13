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

import { useEffect, useState, useContext, useCallback } from "react";
import { MenuItem, MenuItemCommandParams } from "primereact/menuitem";
import { appContext } from "../../AppProvider";
import { createLogoutRequest } from "../../factories/RequestFactory";
import { REQUEST_KEYWORDS } from "../../request";
import { useTranslation } from "..";
import { showTopBar, TopBarContext } from "../../components/topbar/TopBar";
import { ApplicationSettingsResponse } from "../../response";
import { LIB_VERSION } from "../../../version";
import ContentStore from "../../contentstore/ContentStore";
import { MenuOptions, VisibleButtons } from "../../AppSettings";

/**
 * Returns the profile-menu-options and handles the actions of each option.
 */
const useProfileMenuItems = (logoutVisible?: boolean, restartVisible?:boolean) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** Current state of translations */
    const translations = useTranslation();
    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);

    const [slideOptions, setSlideOptions] = useState<Array<MenuItem>>();

    const [changePwEnabled, setChangePwEnabled] = useState<boolean>(context.appSettings.changePasswordEnabled);

    /** removes authKey from local storage, resets contentstore and sends logoutRequest to server */
    const sendLogout = useCallback(() => {
        const logoutRequest = createLogoutRequest();
        localStorage.removeItem("authKey")
        context.contentStore.reset();
        showTopBar(context.server.sendRequest(logoutRequest, REQUEST_KEYWORDS.LOGOUT), topbar)
    }, [context.server, context.contentStore]);

    useEffect(() => {
        context.subscriptions.subscribeToAppSettings((menuOptions: MenuOptions, visibleButtons: VisibleButtons, changePWEnabled: boolean) => setChangePwEnabled(changePWEnabled));

        return () => context.subscriptions.unsubscribeFromAppSettings((appSettings: ApplicationSettingsResponse) => {
            if (appSettings.changePassword !== undefined) {
                setChangePwEnabled(appSettings.changePassword)
            }
        });
    }, [])

    useEffect(() => {
        const currUser = (context.contentStore as ContentStore).currentUser;
        const profileMenuItems: MenuItem[] = []

        if (changePwEnabled) {
            profileMenuItems.push(
                {
                    label: translations.get("Change password"),
                    icon: "pi pi-lock-open",
                    command(e: MenuItemCommandParams) {
                        context.subscriptions.emitChangePasswordVisible()
                    }
                }
            )
        }

        if (logoutVisible !== false) {
            profileMenuItems.push({
                label: translations.get("Logout"),
                icon: "pi pi-power-off",
                command(e: MenuItemCommandParams) {
                    sendLogout()
                }
            })
        }

        if (restartVisible && context.server.preserveOnReload) {
            profileMenuItems.push({
                label: translations.get("Restart"),
                icon: "pi pi-refresh",
                command(e: MenuItemCommandParams) {
                    const startupRequestCache = sessionStorage.getItem("startup");
                    if (startupRequestCache) {
                        const parsedCache = (JSON.parse(startupRequestCache) as Array<any>)
                        parsedCache.forEach((response) => {
                            if (response.preserveOnReload) {
                                response.preserveOnReload = false;
                            }
                        });
                        sessionStorage.setItem("startup", JSON.stringify(parsedCache));
                    }

                    window.location.reload();
                }
            })
        }

        profileMenuItems.push({
            label: "Info",
            icon: "pi pi-info-circle",
            command(e: MenuItemCommandParams) {
                context.subscriptions.emitToast({ name: "", message: "ReactUI Version: " + LIB_VERSION }, "info");
            }
        })
        setSlideOptions([
            {
                label: currUser.displayName,
                icon: currUser.profileImage ? 'profile-image' : 'profile-image-null fas fa-user',
                items: profileMenuItems
            }
        ])
    }, [(context.contentStore as ContentStore).currentUser, translations, changePwEnabled])

    return slideOptions;
}

export default useProfileMenuItems;