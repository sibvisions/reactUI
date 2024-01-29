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
import { MenuItem, MenuItemCommandEvent } from "primereact/menuitem";
import { appContext } from "../../contexts/AppProvider";
import { createAboutRequest, createLogoutRequest } from "../../factories/RequestFactory";
import { showTopBar } from "../../components/topbar/TopBar";
import ContentStore from "../../contentstore/ContentStore";
import { MenuOptions, VisibleButtons } from "../../AppSettings";
import REQUEST_KEYWORDS from "../../request/REQUEST_KEYWORDS";
import { translation } from "../../util/other-util/Translation";
import UserData from "../../model/UserData";

/**
 * Returns the profile-menu-options and handles the actions of each option.
 */
const useProfileMenuItems = (logoutVisible?: boolean, restartVisible?:boolean) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** The model of the profile-menu */
    const [model, setModel] = useState<Array<MenuItem>>();

    /** True, if change-password is enabled */
    const [changePwEnabled, setChangePwEnabled] = useState<boolean>(context.appSettings.changePasswordEnabled);

    /** removes authKey from local storage, resets contentstore and sends logout-request to server */
    const sendLogout = useCallback(() => {
        const logoutRequest = createLogoutRequest();
        localStorage.removeItem("authKey")
        context.contentStore.reset();
        (context.contentStore as ContentStore).currentUser  = new UserData();
        showTopBar(context.server.sendRequest(logoutRequest, REQUEST_KEYWORDS.LOGOUT), context.server.topbar)
    }, [context.server, context.contentStore]);

    // Subscribes to appsettings
    useEffect(() => {
        context.subscriptions.subscribeToAppSettings((menuOptions: MenuOptions, visibleButtons: VisibleButtons, changePWEnabled: boolean) => setChangePwEnabled(changePWEnabled));

        return () => context.subscriptions.unsubscribeFromAppSettings((menuOptions: MenuOptions, visibleButtons: VisibleButtons, changePWEnabled: boolean) => setChangePwEnabled(changePWEnabled));
    }, [])

    // Building the profile-menu-model
    useEffect(() => {
        const currUser = (context.contentStore as ContentStore).currentUser;
        const profileMenuItems: MenuItem[] = []

        if (changePwEnabled) {
            profileMenuItems.push(
                {
                    label: translation.get("Change password"),
                    icon: "pi pi-lock-open",
                    command() {
                        context.subscriptions.emitChangePasswordVisible()
                    }
                }
            )
        }

        if (restartVisible && context.server.preserveOnReload) {
            profileMenuItems.push({
                label: translation.get("Restart"),
                icon: "pi pi-refresh",
                command() {
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
            label: translation.get("About"),
            icon: "pi pi-info-circle",
            command() {
                showTopBar(context.server.sendRequest(createAboutRequest(), REQUEST_KEYWORDS.ABOUT), context.server.topbar)
                //context.subscriptions.emitToast({ name: "", message: "ReactUI Version: " + LIB_VERSION }, "info");
            }
        })

        if (logoutVisible !== false) {
            profileMenuItems.push({
                separator: true
            })

            profileMenuItems.push({
                label: translation.get("Logout"),
                icon: "pi pi-power-off",
                command() {
                    sendLogout()
                }
            })
        }


        setModel([
            {
                label: currUser.displayName,
                icon: currUser.profileImage ? 'profile-image' : 'profile-image-null fas fa-user',
                items: profileMenuItems
            }
        ])
    }, [(context.contentStore as ContentStore).currentUser, translation, changePwEnabled])

    return model;
}

export default useProfileMenuItems;