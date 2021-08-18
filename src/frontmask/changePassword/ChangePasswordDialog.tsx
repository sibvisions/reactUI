/** React imports */
import React, { FC, FormEvent, MouseEventHandler, useContext, useEffect, useState } from "react";

/** 3rd Party imports */
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Dialog } from 'primereact/dialog';

/** Hook imports */
import { useTranslation } from "../../main/components/zhooks";

/** Other imports */
import { appContext } from "../../main/AppProvider";
import { REQUEST_ENDPOINTS } from "../../main/request";
import { createChangePasswordRequest, createLoginRequest } from "../../main/factories/RequestFactory";
import { showTopBar, TopBarContext } from "../../main/components/topbar/TopBar";

interface IChangePasswordDialog  {
    loggedIn: boolean,
    username: string,
    password?: string
}

const ChangePasswordDialog:FC<IChangePasswordDialog> = (props) => {
    /** Current state of username */
    const [username, setUsername] = useState<string>(props.username)

    /** Current state of password */
    const [password, setPassword] = useState<string>(props.password || "");

    /** Current state of new password when changing/resetting password */
    const [newPassword, setNewPassword] = useState<string>("");

    /** Current state of confirming password field */
    const [confirmPassword, setConfirmPassword] = useState<string>("");

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Current state of translations */
    const translations = useTranslation()

    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);

    /** Whether to show the change password dialog */
    const [dialogVisible, setDialogVisible] = useState<boolean>(false);

    useEffect(() => {
        context.subscriptions.subscribeToChangeDialog(() => setDialogVisible(true))
    
        return () => context.subscriptions.unsubscribeFromChangeDialog();
    }, [context.subscriptions])

    const onDialogHide = () => {
        setDialogVisible(false)
    };

    const isReset = context.appSettings.loginMode === "changeOneTimePassword";

    const sendChangedPassword = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!newPassword) {
            context.subscriptions.emitMessage({ message: translations.get("The new password is empty"), name: "" }, false);
        }
        else if (newPassword !== confirmPassword) {
            context.subscriptions.emitMessage({ message: translations.get("The passwords are different!"), name: "" }, false);
        }
        else if (newPassword === props.password) {
            context.subscriptions.emitMessage({ message: translations.get("The old and new password are the same"), name: "" }, false);
        }
        else {
            if (props.loggedIn) {
                const changeReq = createChangePasswordRequest();
                changeReq.password = password;
                changeReq.newPassword = newPassword;
                showTopBar(context.server.sendRequest(changeReq, REQUEST_ENDPOINTS.CHANGE_PASSWORD), topbar)
            }
            else {
                const loginReq = createLoginRequest();
                loginReq.username = username;
                loginReq.password = password;
                loginReq.newPassword = newPassword;
                loginReq.mode = context.appSettings.loginMode;
                loginReq.createAuthKey = false;
                showTopBar(context.server.sendRequest(loginReq, REQUEST_ENDPOINTS.LOGIN), topbar)
                context.subscriptions.emitMenuUpdate();
            }
        }
        setPassword("");
        setNewPassword("");
        setConfirmPassword("");
    }

    return (
        <Dialog
            className="rc-popup change-dialog"
            header={isReset ? translations.get("Reset password") : translations.get("Change password")}
            visible={dialogVisible} onHide={onDialogHide}
            draggable={false} >
            <div className="change-dialog-container">
                <form onSubmit={sendChangedPassword} className="change-password-form">
                    <div className="p-field" style={{ fontSize: "1rem", fontWeight: "bold" }}>
                        {isReset ? translations.get("Please enter your one-time password and set a new password") : translations.get("Please enter and confirm the new password.")}
                    </div>
                    <div className="p-field p-float-label p-input-icon-left">
                        <i className="pi pi-user" />
                        <InputText
                            value={username}
                            id="change-username"
                            type="text"
                            autoComplete="change-username"
                            onChange={isReset ? (event: React.ChangeEvent<HTMLInputElement>) => setUsername(event.target.value) : undefined}
                            disabled={!isReset} />
                        <label className="change-password-label" htmlFor="change-username">{translations.get("Username")} </label>
                    </div>
                    <div className="p-field p-float-label p-input-icon-left">
                        <i className="pi pi-key" />
                        <InputText
                            value={password}
                            id="change-password"
                            type="password"
                            autoComplete="change-password"
                            onChange={(props.loggedIn || isReset) ? (passEvent: React.ChangeEvent<HTMLInputElement>) => setPassword(passEvent.target.value) : undefined}
                            disabled={!(props.loggedIn || isReset)} />
                        <label className="change-password-label" htmlFor="change-password">
                            {isReset ? translations.get("One-time password") : translations.get("Password")}
                        </label>
                    </div>
                    <div className="p-field p-float-label p-input-icon-left">
                        <i className="pi pi-key" />
                        <InputText
                            value={newPassword}
                            id="change-password-new"
                            type="password"
                            autoComplete="change-password-new"
                            onChange={(passEvent: React.ChangeEvent<HTMLInputElement>) => setNewPassword(passEvent.target.value)} />
                        <label className="change-password-label" htmlFor="change-password-new">{translations.get("New Password")} </label>
                    </div>
                    <div className="p-field p-float-label p-input-icon-left">
                        <i className="pi pi-check" />
                        <InputText
                            value={confirmPassword}
                            id="change-password-confirm"
                            type="password"
                            autoComplete="change-password-new"
                            onChange={(passEvent: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(passEvent.target.value)} />
                        <label className="change-password-label" htmlFor="change-password-confirm">{translations.get("Confirm Password")} </label>
                    </div>
                    <div className="change-password-button-wrapper">
                        <Button type="button" label={translations.get("Cancel")} icon="pi pi-times" onClick={onDialogHide} />
                        <Button type="submit" label={translations.get("Login")} icon="pi pi-lock-open" />
                    </div>
                </form>
            </div>
        </Dialog>
    )
}
export default ChangePasswordDialog