/** React imports */
import React, { FC, FormEvent, useContext, useState } from "react";

/** 3rd Party imports */
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";

/** Hook imports */
import { useTranslation } from "../../main/components/zhooks";

/** Other imports */
import { appContext } from "../../main/AppProvider";
import { REQUEST_ENDPOINTS } from "../../main/request";
import { createLoginRequest, createResetPasswordRequest } from "../../main/factories/RequestFactory";
import { showTopBar, TopBarContext } from "../../main/components/topbar/TopBar";
import ChangePasswordDialog from "../changePassword/ChangePasswordDialog";
import { concatClassnames } from "../../main/components/util";



/** Component which handles logging in */
const Login: FC = () => {
    /** Current state of username */
    const [username, setUsername] = useState<string>("");

    /** Current state of password */
    const [password, setPassword] = useState<string>("");

    /** Current state of remember me checkbox value */
    const [rememberMe, setRememberMe] = useState<boolean>(false);

    /** Whether to show the reset-mask or not */
    const [showResetMask, setShowResetMask] = useState<boolean>(false);

    /** Current state of email when the reset mask is shown */
    const [email, setEmail] = useState<string>("");

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Current state of translations */
    const translations = useTranslation()

    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);

    /**
     * Sends a loginrequest to the server when the loginform is submitted.
     */
    const loginSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const loginReq = createLoginRequest();
        loginReq.username = username;
        loginReq.password = password;
        loginReq.mode = "manual";
        loginReq.createAuthKey = rememberMe;
        showTopBar(context.server.sendRequest(loginReq, REQUEST_ENDPOINTS.LOGIN), topbar)
        context.subscriptions.emitRegisterCustom();
        context.subscriptions.emitMenuUpdate();
    }

    const sendResetPassword = () => {
        if (!email) {
            context.showToast({ severity: 'info', summary: translations.get("The email is required"), sticky: true, closable: false }, false)
        }
        else {
            const resetReq = createResetPasswordRequest();
            resetReq.identifier = email;
            showTopBar(context.server.sendRequest(resetReq, REQUEST_ENDPOINTS.RESET_PASSWORD), topbar)
        }
    }

    return(
        <div className="login-container">
            <ChangePasswordDialog 
                username={username} 
                password={password} 
                loggedIn={false} />
            <form onSubmit={loginSubmit} className="login-form">
                <div className="login-logo-wrapper">
                    <img className="login-logo" src={(process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.contentStore.LOGO_LOGIN} alt="logo" />
                </div>
                {!showResetMask ? 
                <div className="p-fluid">
                    <div className="p-field p-float-label p-input-icon-left">
                        <i className="pi pi-user" />
                        <InputText
                            value={username}
                            id="username"
                            type="text"
                            autoComplete="username"
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setUsername(event.target.value)}/>
                        <label htmlFor="username">{translations.get("Username")} </label>
                    </div>
                    <div className="p-field p-float-label p-input-icon-left">
                        <i className="pi pi-key" />
                        <InputText
                            value={password}
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}/>
                        <label htmlFor="password">{translations.get("Password")} </label>
                    </div>
                    <div className={concatClassnames(
                        "login-extra-options",
                        context.contentStore.applicationMetaData.lostPasswordEnabled ? "lost-password-enabled" : "")} >
                        <div className="login-cbx-container">
                            <Checkbox inputId="rememberMe" className="remember-me-cbx" checked={rememberMe} onChange={(event) => setRememberMe(event.checked)} />
                            <label htmlFor="rememberMe" className="p-checkbox-label">{translations.get("Remember me?")}</label>
                        </div>
                        {context.contentStore.applicationMetaData.lostPasswordEnabled && 
                            <Button 
                                className="lost-password-button" 
                                label={translations.get("Lost password")} 
                                icon="pi pi-question-circle" 
                                onClick={() => setShowResetMask(true)} />
                        }
                    </div>
                    <Button type="submit" className="p-primary login-button" label={translations.get("Login")} icon="pi pi-lock-open"/>
                </div> 
                :
                <div className="p-fluid">
                    <div className="p-field" style={{ fontSize: "1rem", fontWeight: "bold" }} >
                        {translations.get("Please enter your e-mail address.")}
                    </div>
                    <div className="p-field p-float-label p-input-icon-left">
                        <i className="pi pi-inbox" />
                        <InputText
                            value={email}
                            id="email"
                            type="text"
                            autoComplete="email"
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}/>
                        <label htmlFor="email">{translations.get("Email")} </label>
                    </div>
                    <div className="change-password-button-wrapper">
                        <Button type="button" className="lost-password-button" label={translations.get("Cancel")} icon="pi pi-times" onClick={() => setShowResetMask(false)}/>
                        <Button type="button" className="lost-password-button" label={translations.get("Request")} icon="pi pi-send" onClick={sendResetPassword}/>
                    </div>
                </div>
                }
            </form>
        </div>
    )
}
export default Login;