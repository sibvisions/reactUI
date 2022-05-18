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

import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { InputText } from "primereact/inputtext";
import React, { CSSProperties, FC, FormEvent, useContext, useEffect, useState } from "react";
import tinycolor from "tinycolor2";
import { showTopBar } from "../../main/components/topbar/TopBar";
import { REQUEST_KEYWORDS } from "../../main/request";
import { concatClassnames } from "../../main/util";
import { createLoginRequest, useConstants } from "../../moduleIndex";
import ChangePasswordDialog from "../change-password/ChangePasswordDialog";
import { LoginContext } from "./Login";

export interface ILoginForm {
    changeLoginMode: Function
    errorMessage?: string
}

/**
 * Returns the login-form to log into the application.
 * @param props - the properties contains a function to change the login-mode
 */
const LoginForm:FC<ILoginForm> = (props) => {
    /** Returns utility variables */
    const [context, topbar, translations] = useConstants();

    const loginContext = useContext(LoginContext);

    /** State for username field */
    const [username, setUsername] = useState<string>("");

    /** State for password field */
    const [password, setPassword] = useState<string>("");

    /** State for remember-me checkbox */
    const [rememberMe, setRememberMe] = useState<boolean>(false);

    /** The button background-color, taken from the "primary-color" variable of the css-scheme */
    const btnBgd = window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color');

    /**
     * Sends a loginrequest to the server when the loginform is submitted.
     */
     const loginSubmit = (e: FormEvent<HTMLFormElement>) => {
        loginContext.username = username;
        loginContext.password = password;
        e.preventDefault()
        const loginReq = createLoginRequest();
        loginReq.username = username;
        loginReq.password = password;
        loginReq.mode = "manual";
        loginReq.createAuthKey = rememberMe;
        context.server.loginError = undefined;
        context.subscriptions.emitLoginChanged(undefined, undefined)
        showTopBar(context.server.sendRequest(loginReq, REQUEST_KEYWORDS.LOGIN), topbar)
        context.subscriptions.emitMenuUpdate();
    }

    return (
        <>
            <ChangePasswordDialog
                username={username}
                password={password}
                loggedIn={false} />
            <form onSubmit={loginSubmit} className="login-form">
                <div className="login-logo-wrapper">
                    <img className="login-logo" src={(process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.appSettings.LOGO_LOGIN} alt="logo" />
                </div>
                <div className="p-fluid">
                        {props.errorMessage && 
                        <div className="login-error-message p-field">
                            { translations.has(props.errorMessage) ? translations.get(props.errorMessage) : props.errorMessage}
                        </div>
                        }
                        <div className="p-field p-float-label p-input-icon-left">
                            <i className="pi pi-user" />
                            <InputText
                                value={username}
                                id="username"
                                type="text"
                                autoComplete="username"
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setUsername(event.target.value)} />
                            <label htmlFor="username">{translations.get("Username")} </label>
                        </div>
                        <div className="p-field p-float-label p-input-icon-left">
                            <i className="pi pi-key" />
                            <InputText
                                value={password}
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)} />
                            <label htmlFor="password">{translations.get("Password")} </label>
                        </div>
                        <div className={concatClassnames(
                            "login-extra-options",
                            context.appSettings.applicationMetaData.lostPasswordEnabled ? "lost-password-enabled" : "")} >
                            <div className="login-cbx-container">
                                <Checkbox 
                                    inputId="rememberMe" 
                                    className="remember-me-cbx" 
                                    checked={rememberMe} 
                                    onChange={(event) => setRememberMe(prevState => event.checked)} />
                                <label htmlFor="rememberMe" className="p-checkbox-label">{translations.get("Remember me?")}</label>
                            </div>
                            {context.appSettings.applicationMetaData.lostPasswordEnabled &&
                                <Button
                                    type="button"
                                    className="lost-password-button rc-button mouse-border"
                                    style={{
                                        '--background': btnBgd,
                                        '--hoverBackground': tinycolor(btnBgd).darken(5).toString()
                                    } as CSSProperties}
                                    label={translations.get("Lost password")}
                                    icon="pi pi-question-circle"
                                    onClick={() => props.changeLoginMode("reset")} />
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
            </form>
        </>
    )
}
export default LoginForm