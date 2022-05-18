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

import React, { createContext, FC, useContext, useEffect, useRef, useState } from "react";
import { appContext } from "../../main/AppProvider";
import { componentHandler } from "../../main/factories/UIFactory";
import ResizeHandler from "../screen-management/ResizeHandler";
import { ResizeContext } from "../screen-management/ui-manager/UIManager";
import BaseComponent from "../../main/util/types/BaseComponent";
import { LoginForm, ResetForm } from "./"
import MFAText from "./MFAText";
import { LoginModeType } from "../../main/response";
import MFAWait from "./MFAWait";
import MFAURL from "./MFAURL";

/** 
 * Properties which the dialog will receive when it's rendered
 */
export interface ILoginCredentials {
    username: string,
    password: string
}

type LoginMode = "default"|"reset"|"mFTextInput"|"mFWait"|"mFURL"

/**
 * Renders the DesktopPanel, casted as BaseComponent because we check in other components if the DesktopPanel exists.
 */
export const DesktopPanelHandler:FC = () => {
    const context = useContext(appContext);
    return componentHandler(context.appSettings.desktopPanel as BaseComponent, context.contentStore);
}

export const LoginContext = createContext<ILoginCredentials>({ username: "", password: "" });

/** Component which handles logging in */
const Login: FC = () => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Reference for the screen-container */
    const sizeRef = useRef<any>(null);

    const [loginMode, setLoginMode] = useState<LoginMode>("default");

    const [loginError, setLoginError] = useState<string|undefined>(context.server.loginError);

    const [loginData] = useState<ILoginCredentials>({ username: "", password: "" });

    useEffect(() => {
        context.subscriptions.subscribeToLogin((mode?:LoginModeType, error?:string) => {
            if (mode) {
                if (mode === "automatic" || mode === "manual") {
                    setLoginMode("default")
                }
                else {
                    setLoginMode(mode as LoginMode)
                }
    
            }

            if (error) {
                setLoginError(error);
            }
        });

        return () => {
            context.subscriptions.unsubscribeFromLogin();
        }
    }, []);

    const getCorrectLoginForm = () => {
        const modeFunc = (mode:LoginMode) => setLoginMode(mode);

        switch (loginMode) {
            case "default":
                return <LoginForm changeLoginMode={modeFunc} errorMessage={loginError} />;
            case "reset":
                return <ResetForm changeLoginMode={modeFunc} />;
            case "mFTextInput":
                return <MFAText changeLoginMode={modeFunc} />;
            case "mFWait":
                return <MFAWait changeLoginMode={modeFunc} />;
            case "mFURL":
                return <MFAURL changeLoginMode={modeFunc} />;
            default:
                return <LoginForm changeLoginMode={modeFunc} errorMessage={loginError} />;

        }
    }
    
    // If there is a desktop-panel, render it and the login mask "above" it, if not, just display the login mask
    return (
        <LoginContext.Provider value={loginData}>
            {(context.appSettings.desktopPanel) ?
                <ResizeContext.Provider value={{ login: true }}>
                    <ResizeHandler>
                        <div className="rc-glasspane login-glass" />
                        <div className="login-container-with-desktop" ref={sizeRef}>
                            <DesktopPanelHandler />
                            <div className="login-form-position-wrapper">
                                {getCorrectLoginForm()}
                            </div>
                        </div>
                    </ResizeHandler>
                </ResizeContext.Provider>
                :
                <div className="login-container">
                    {getCorrectLoginForm()}
                </div>}
        </LoginContext.Provider>

    )
}
export default Login;