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

import React, { FC, FormEvent, useContext, useEffect, useState } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Dialog } from 'primereact/dialog';
import { createChangePasswordRequest, createLoginRequest } from "../../main/factories/RequestFactory";
import { showTopBar } from "../../main/components/topbar/TopBar";
import ILoginCredentials from "../login/ILoginCredentials";
import REQUEST_KEYWORDS from "../../main/request/REQUEST_KEYWORDS";
import BaseResponse from "../../main/response/BaseResponse";
import RESPONSE_NAMES from "../../main/response/RESPONSE_NAMES";
import { translation } from "../../main/util/other-util/Translation";
import { appContext } from "../../main/contexts/AppProvider";
import { FloatLabel } from "primereact/floatlabel";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { useHistory } from "react-router";

// Interface for the ChangePasswordDialog
interface IChangePasswordDialog  {
    loggedIn: boolean,
    username: string,
    password?: string
}

/** Interface for change-password-state */
interface IChangePasswordType extends ILoginCredentials {
    newPassword: string,
    confirmPassword: string
}

/**
 * This component displays a dialog to change the password of a user. There are two modes depending on password changing or resetting
 * @param props - the props to start the dialog with
 */
const ChangePasswordDialog:FC<IChangePasswordDialog> = (props) => {
    /** Returns utility variables */
    const context = useContext(appContext);

    /** Contains data of the change-password mask */
    const [changePWData, setChangePWData] = useState<IChangePasswordType>({username: props.username, password: props.password || "", newPassword: "", confirmPassword: ""});

    /** Whether to show the change password dialog */
    const [visible, setVisible] = useState<boolean>(false);

    /** True, if the password is resetting and not changing */
    const isReset = context.appSettings.loginMode === "changeOneTimePassword";

    // Subscribes to the dialog state, sets visible true when called
    useEffect(() => {
        context.subscriptions.subscribeToChangePasswordVisible(() => setVisible(true));
    
        return () => context.subscriptions.unsubscribeFromChangePasswordVisible();
    }, [context.subscriptions]);

    // Changes the username when the username prop changes
    useEffect(() => {
        setChangePWData(prevState => ({ ...prevState, username: props.username }));
    }, [props.username])

    // Changes the password when the password prop changes
    useEffect(() => {
        if (props.password) {
            setChangePWData(prevState => ({ ...prevState, password: props.password as string }));
        }
    }, [props.password]);

    /**
     * Sends a login request to change the password of a user.
     * Checks if the new password is legitimate and sends the correct request based on logged in or not
     * @param e - the FormEvent
     */
    const sendChangedPassword = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!changePWData.newPassword) {
            context.subscriptions.emitToast({ message: translation.get("The new password is empty"), name: "" });
        }
        else if (changePWData.newPassword !== changePWData.confirmPassword) {
            context.subscriptions.emitToast({ message: translation.get("The passwords are different!"), name: "" });
        }
        else if (changePWData.newPassword === props.password) {
            context.subscriptions.emitToast({ message: translation.get("The old and new password are the same"), name: "" });
        }
        else {
            if (props.loggedIn) {
                const changeReq = createChangePasswordRequest();
                changeReq.password = changePWData.password;
                changeReq.newPassword = changePWData.newPassword;
                showTopBar(context.server.sendRequest(changeReq, REQUEST_KEYWORDS.CHANGE_PASSWORD), context.server.topbar).then((results:BaseResponse[]) => {
                    results.forEach(result => {
                        if (result.name === RESPONSE_NAMES.DIALOG) {
                            setVisible(false);
                        }
                    })
                });
                setChangePWData(prevState => ({...prevState, password: "", newPassword: "", confirmPassword: ""}));
            }
            else {
                const loginReq = createLoginRequest();
                loginReq.username = changePWData.username;
                loginReq.password = changePWData.password;
                loginReq.newPassword = changePWData.newPassword;
                loginReq.mode = context.appSettings.loginMode;
                loginReq.createAuthKey = false;
                showTopBar(context.server.sendRequest(loginReq, REQUEST_KEYWORDS.LOGIN), context.server.topbar);
                setChangePWData(prevState => ({...prevState, password: props.password || "", newPassword: "", confirmPassword: ""}));
                context.subscriptions.emitMenuUpdate();
            }
        }
    }

    //if there is a history change close the dialog
    const history = useHistory();
    useEffect(() => {
        return history.block(() => {
            if(visible) {
                setVisible(false);
            }
            return !visible;
        })
    }, [history, visible, setVisible])

    return (
        <Dialog
            className="rc-popup change-dialog"
            header={isReset ? translation.get("Reset password") : translation.get("Change password")}
            visible={visible} 
            onHide={() => setVisible(false)}
            draggable={false}
            baseZIndex={1005} >
            <div className="change-dialog-container">
                <form onSubmit={sendChangedPassword} className="change-password-form">
                    <div className="p-field" style={{ fontSize: "1rem", fontWeight: "bold" }}>
                        {isReset ? translation.get("Please enter your one-time password and set a new password") : translation.get("Please enter and confirm the new password.")}
                    </div>
                    <FloatLabel>
                        <IconField iconPosition="left">
                            <InputIcon className="pi pi-user" />
                            <InputText
                                value={changePWData.username}
                                className="login-inputtext"
                                id="change-username"
                                type="text"
                                autoComplete="change-username"
                                onChange={isReset ? (event: React.ChangeEvent<HTMLInputElement>) => setChangePWData(prevState => ({...prevState, username: event.target.value})) : undefined}
                                disabled={!isReset} />
                        </IconField>
                        <label className="change-password-label" htmlFor="change-username">{translation.get("Username")} </label>
                    </FloatLabel>
                    <FloatLabel>
                        <IconField iconPosition="left">
                            <InputIcon className="pi pi-key" />
                            <InputText
                                value={changePWData.password}
                                className="login-inputtext"
                                id="change-password"
                                type="password"
                                autoComplete="change-password"
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setChangePWData(prevState => ({...prevState, password: event.target.value}))}
                                disabled={!isReset && !props.loggedIn}
                                autoFocus={isReset || props.loggedIn} />
                        </IconField>
                        <label className="change-password-label" htmlFor="change-password">
                            {isReset ? translation.get("One-time password") : translation.get("Password")}
                        </label>
                    </FloatLabel>
                    <FloatLabel>
                        <IconField iconPosition="left">
                            <InputIcon className="pi pi-key" />
                            <InputText
                                value={changePWData.newPassword}
                                id="change-password-new"
                                type="password"
                                autoComplete="change-password-new"
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setChangePWData(prevState => ({...prevState, newPassword: event.target.value}))} 
                                autoFocus={!isReset && !props.loggedIn}/>
                        </IconField>
                        <label className="change-password-label" htmlFor="change-password-new">{translation.get("New Password")} </label>
                    </FloatLabel>
                    <FloatLabel>
                        <IconField iconPosition="left">
                            <InputIcon className="pi pi-check" />
                            <InputText
                                value={changePWData.confirmPassword}
                                id="change-password-confirm"
                                type="password"
                                autoComplete="change-password-new"
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setChangePWData(prevState => ({...prevState, confirmPassword: event.target.value}))} />
                        </IconField>
                        <label className="change-password-label" htmlFor="change-password-confirm">{translation.get("Confirm Password")} </label>
                    </FloatLabel>
                    <div className="change-password-button-wrapper">
                        <Button type="button" label={translation.get("Cancel")} icon="pi pi-times" onClick={() => setVisible(false)} />
                        <Button type="submit" label={translation.get(!isReset ? "Change" : "Login")} icon="pi pi-lock-open" />
                    </div>
                </form>
            </div>
        </Dialog>
    )
}
export default ChangePasswordDialog