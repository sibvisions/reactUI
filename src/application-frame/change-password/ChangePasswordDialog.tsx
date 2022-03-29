import React, { FC, FormEvent, useEffect, useState } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Dialog } from 'primereact/dialog';
import { useConstants } from "../../main/components/zhooks";
import { createChangePasswordRequest, createLoginRequest } from "../../main/factories/RequestFactory";
import { showTopBar } from "../../main/components/topbar/TopBar";
import { BaseResponse, RESPONSE_NAMES } from "../../main/response";
import { ILoginCredentials } from "../login/login";
import { REQUEST_KEYWORDS } from "../../main/request";

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
    const [context, topbar, translations] = useConstants();

    /** Contains data of the change-password mask */
    const [changePWData, setChangePWData] = useState<IChangePasswordType>({username: props.username, password: props.password || "", newPassword: "", confirmPassword: ""});

    /** Whether to show the change password dialog */
    const [dialogVisible, setDialogVisible] = useState<boolean>(false);

    /** True, if the password is resetting and not changing */
    const isReset = context.appSettings.loginMode === "changeOneTimePassword";

    // Subscribes to the dialog state, sets visible true when called
    useEffect(() => {
        context.subscriptions.subscribeToDialog("change-password", () => setDialogVisible(true));
    
        return () => context.subscriptions.unsubscribeFromDialog("change-password");
    }, [context.subscriptions]);

    /**
     * Sends a login request to change the password of a user.
     * Checks if the new password is legitimate and sends the correct request based on logged in or not
     * @param e - the FormEvent
     */
    const sendChangedPassword = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!changePWData.newPassword) {
            context.subscriptions.emitMessage({ message: translations.get("The new password is empty"), name: "" });
        }
        else if (changePWData.newPassword !== changePWData.confirmPassword) {
            context.subscriptions.emitMessage({ message: translations.get("The passwords are different!"), name: "" });
        }
        else if (changePWData.newPassword === props.password) {
            context.subscriptions.emitMessage({ message: translations.get("The old and new password are the same"), name: "" });
        }
        else {
            if (props.loggedIn) {
                const changeReq = createChangePasswordRequest();
                changeReq.password = changePWData.password;
                changeReq.newPassword = changePWData.newPassword;
                showTopBar(context.server.sendRequest(changeReq, REQUEST_KEYWORDS.CHANGE_PASSWORD), topbar).then((results:BaseResponse[]) => {
                    results.forEach(result => {
                        if (result.name === RESPONSE_NAMES.DIALOG) {
                            setDialogVisible(false);
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
                showTopBar(context.server.sendRequest(loginReq, REQUEST_KEYWORDS.LOGIN), topbar);
                setChangePWData(prevState => ({...prevState, password: props.password || "", newPassword: "", confirmPassword: ""}));
                context.subscriptions.emitMenuUpdate();
            }
        }
        
    }

    return (
        <Dialog
            className="rc-popup change-dialog"
            header={isReset ? translations.get("Reset password") : translations.get("Change password")}
            visible={dialogVisible} 
            onHide={() => setDialogVisible(false)}
            draggable={false}
            baseZIndex={1005} >
            <div className="change-dialog-container">
                <form onSubmit={sendChangedPassword} className="change-password-form">
                    <div className="p-field" style={{ fontSize: "1rem", fontWeight: "bold" }}>
                        {isReset ? translations.get("Please enter your one-time password and set a new password") : translations.get("Please enter and confirm the new password.")}
                    </div>
                    <div className="p-field p-float-label p-input-icon-left">
                        <i className="pi pi-user" />
                        <InputText
                            value={changePWData.username}
                            id="change-username"
                            type="text"
                            autoComplete="change-username"
                            onChange={isReset ? (event: React.ChangeEvent<HTMLInputElement>) => setChangePWData(prevState => ({...prevState, username: event.target.value})) : undefined}
                            disabled={!isReset} />
                        <label className="change-password-label" htmlFor="change-username">{translations.get("Username")} </label>
                    </div>
                    <div className="p-field p-float-label p-input-icon-left">
                        <i className="pi pi-key" />
                        <InputText
                            value={changePWData.password}
                            id="change-password"
                            type="password"
                            autoComplete="change-password"
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setChangePWData(prevState => ({...prevState, password: event.target.value}))}
                            disabled={!isReset && !props.loggedIn} />
                        <label className="change-password-label" htmlFor="change-password">
                            {isReset ? translations.get("One-time password") : translations.get("Password")}
                        </label>
                    </div>
                    <div className="p-field p-float-label p-input-icon-left">
                        <i className="pi pi-key" />
                        <InputText
                            value={changePWData.newPassword}
                            id="change-password-new"
                            type="password"
                            autoComplete="change-password-new"
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setChangePWData(prevState => ({...prevState, newPassword: event.target.value}))} />
                        <label className="change-password-label" htmlFor="change-password-new">{translations.get("New Password")} </label>
                    </div>
                    <div className="p-field p-float-label p-input-icon-left change-password-confirm">
                        <i className="pi pi-check" />
                        <InputText
                            value={changePWData.confirmPassword}
                            id="change-password-confirm"
                            type="password"
                            autoComplete="change-password-new"
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setChangePWData(prevState => ({...prevState, confirmPassword: event.target.value}))} />
                        <label className="change-password-label" htmlFor="change-password-confirm">{translations.get("Confirm Password")} </label>
                    </div>
                    <div className="change-password-button-wrapper">
                        <Button type="button" label={translations.get("Cancel")} icon="pi pi-times" onClick={() => setDialogVisible(false)} />
                        <Button type="submit" label={translations.get(!isReset ? "Change" : "Login")} icon="pi pi-lock-open" />
                    </div>
                </form>
            </div>
        </Dialog>
    )
}
export default ChangePasswordDialog