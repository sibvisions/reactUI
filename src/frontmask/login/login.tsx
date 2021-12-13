/** React imports */
import React, { CSSProperties, FC, FormEvent, useContext, useRef, useState } from "react";

/** 3rd Party imports */
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";

/** Hook imports */
import { useConstants } from "../../main/components/zhooks";

/** Other imports */
import { appContext } from "../../main/AppProvider";
import { REQUEST_ENDPOINTS } from "../../main/request";
import { createLoginRequest, createResetPasswordRequest } from "../../main/factories/RequestFactory";
import { showTopBar } from "../../main/components/topbar/TopBar";
import ChangePasswordDialog from "../changePassword/ChangePasswordDialog";
import { concatClassnames } from "../../main/components/util";
import { componentHandler } from "../../main/factories/UIFactory";
import ResizeHandler from "../ResizeHandler";
import { ResizeContext } from "../UIManager";
import tinycolor from "tinycolor2";

/** 
 * Properties which the dialog will receive when it's rendered
 */
export interface ILoginCredentials {
    username: string,
    password: string
}

interface ILoginMaskType extends ILoginCredentials {
    rememberMe: boolean,
    showResetMask: boolean,
    email: string
}

export const DesktopPanelHandler:FC = () => {
    const context = useContext(appContext);
    return (context.appSettings.desktopPanel ?
         componentHandler(context.appSettings.desktopPanel, context.contentStore) :
         <div>Could not load DesktopPanel</div>)
}

export const LoginForm:FC = () => {
    /** Returns utility variables */
    const [context, topbar, translations] = useConstants();
    
    /** State for login-data */
    const [loginData, setLoginData] = useState<ILoginMaskType>({ username: "", password: "", email: "", rememberMe: false, showResetMask: false });

    const btnBgd = window.getComputedStyle(document.documentElement).getPropertyValue('--' + context.appSettings.applicationMetaData.applicationColorScheme.value + '-button-color');

    /**
     * Sends a loginrequest to the server when the loginform is submitted.
     */
     const loginSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const loginReq = createLoginRequest();
        loginReq.username = loginData.username;
        loginReq.password = loginData.password;
        loginReq.mode = "manual";
        loginReq.createAuthKey = loginData.rememberMe;
        showTopBar(context.server.sendRequest(loginReq, REQUEST_ENDPOINTS.LOGIN), topbar)
        context.subscriptions.emitMenuUpdate();
    }

    const sendResetPassword = () => {
        if (!loginData.email) {
            context.subscriptions.emitMessage({ message: translations.get("The email is required"), name: "" });
        }
        else {
            const resetReq = createResetPasswordRequest();
            resetReq.identifier = loginData.email;
            showTopBar(context.server.sendRequest(resetReq, REQUEST_ENDPOINTS.RESET_PASSWORD), topbar)
        }
    }

    return (
        <>
            <ChangePasswordDialog
                username={loginData.username}
                password={loginData.password}
                loggedIn={false} />
            <form onSubmit={loginSubmit} className="login-form">
                <div className="login-logo-wrapper">
                    <img className="login-logo" src={(process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.appSettings.LOGO_LOGIN} alt="logo" />
                </div>
                {!loginData.showResetMask ?
                    <div className="p-fluid">
                        <div className="p-field p-float-label p-input-icon-left">
                            <i className="pi pi-user" />
                            <InputText
                                value={loginData.username}
                                id="username"
                                type="text"
                                autoComplete="username"
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setLoginData(prevState => ({...prevState, username: event.target.value}))} />
                            <label htmlFor="username">{translations.get("Username")} </label>
                        </div>
                        <div className="p-field p-float-label p-input-icon-left">
                            <i className="pi pi-key" />
                            <InputText
                                value={loginData.password}
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setLoginData(prevState => ({...prevState, password: event.target.value}))} />
                            <label htmlFor="password">{translations.get("Password")} </label>
                        </div>
                        <div className={concatClassnames(
                            "login-extra-options",
                            context.appSettings.applicationMetaData.lostPasswordEnabled ? "lost-password-enabled" : "")} >
                            <div className="login-cbx-container">
                                <Checkbox 
                                    inputId="rememberMe" 
                                    className="remember-me-cbx" 
                                    checked={loginData.rememberMe} 
                                    onChange={(event) => setLoginData(prevState => ({...prevState, rememberMe: event.checked}))} />
                                <label htmlFor="rememberMe" className="p-checkbox-label">{translations.get("Remember me?")}</label>
                            </div>
                            {context.appSettings.applicationMetaData.lostPasswordEnabled &&
                                <Button
                                    type="button"
                                    className="lost-password-button rc-button"
                                    style={{
                                        '--background': btnBgd,
                                        '--hoverBackground': tinycolor(btnBgd).darken(5).toString()
                                    } as CSSProperties}
                                    label={translations.get("Lost password")}
                                    icon="pi pi-question-circle"
                                    onClick={() => setLoginData(prevState => ({...prevState, showResetMask: true}))} />
                            }
                        </div>
                        <Button 
                            type="submit" 
                            className="login-button rc-button"
                            style={{
                                '--background': btnBgd,
                                '--hoverBackground': tinycolor(btnBgd).darken(5).toString()
                            } as CSSProperties} 
                            label={translations.get("Login")}
                            icon="pi pi-lock-open" />
                    </div>
                    :
                    <div className="p-fluid">
                        <div className="p-field" style={{ fontSize: "1rem", fontWeight: "bold" }} >
                            {translations.get("Please enter your e-mail address.")}
                        </div>
                        <div className="p-field p-float-label p-input-icon-left">
                            <i className="pi pi-inbox" />
                            <InputText
                                value={loginData.email}
                                id="email"
                                type="text"
                                autoComplete="email"
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setLoginData(prevState => ({...prevState, email: event.target.value}))} />
                            <label htmlFor="email">{translations.get("Email")} </label>
                        </div>
                        <div className="change-password-button-wrapper">
                            <Button 
                                type="button" 
                                className="lost-password-button rc-button" 
                                style={{
                                    '--background': btnBgd,
                                    '--hoverBackground': tinycolor(btnBgd).darken(5).toString()
                                } as CSSProperties}
                                label={translations.get("Cancel")} 
                                icon="pi pi-times" 
                                onClick={() => setLoginData(prevState => ({...prevState, showResetMask: false}))} />
                            <Button 
                                type="button" 
                                className="lost-password-button rc-button"
                                style={{
                                    '--background': btnBgd,
                                    '--hoverBackground': tinycolor(btnBgd).darken(5).toString()
                                } as CSSProperties}
                                label={translations.get("Request")} 
                                icon="pi pi-send" 
                                onClick={sendResetPassword} />
                        </div>
                    </div>
                }
            </form>
        </>
    )
}

/** Component which handles logging in */
const Login: FC = () => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Reference for the screen-container */
    const sizeRef = useRef<any>(null);
    
    return (
        (context.appSettings.desktopPanel) ?
            <ResizeContext.Provider value={{ login: true }}>
                <ResizeHandler>
                    <div className="rc-glasspane" />
                    <div className="login-container-with-desktop" ref={sizeRef}>
                        <DesktopPanelHandler />
                        <div className="login-form-position-wrapper">
                            <LoginForm />
                        </div>
                    </div>
                </ResizeHandler>
            </ResizeContext.Provider>
            :
            <div className="login-container">
                <LoginForm />
            </div>
    )
}
export default Login;