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

import React, { FC, useContext, useEffect, useRef, useState } from "react";
import { appContext } from "../../main/contexts/AppProvider";
import { componentHandler } from "../../main/factories/UIFactory";
import ResizeHandler from "../screen-management/ResizeHandler";
import BaseComponent from "../../main/util/types/BaseComponent";
import LoginForm from "./LoginForm"
import ResetForm from "./ResetForm";
import MFAText from "./MFAText";
import MFAWait from "./MFAWait";
import MFAURL from "./MFAURL";
import ILoginCredentials from "./ILoginCredentials";
import ResizeProvider from "../../main/contexts/ResizeProvider";
import { LoginModeType } from "../../main/response/login/LoginResponse";

/** 
 * Properties which the dialog will receive when it's rendered
 */


type LoginMode = "default"|"reset"|"mFTextInput"|"mFWait"|"mFURL"

/** Component which handles logging in */
const Login: FC = () => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Reference for the screen-container */
    const sizeRef = useRef<any>(null);

    const [loginMode, setLoginMode] = useState<LoginMode>("default");

    const [loginError, setLoginError] = useState<string|undefined>(context.server.loginError);

    const [loginData, setLoginData] = useState<ILoginCredentials>({ username: "", password: "" });

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

        const loginDataCallback = (username: string, password: string) => setLoginData({ username: username, password: password })

        switch (loginMode) {
            case "default":
                return <LoginForm username={loginData.username} password={loginData.password} changeLoginData={loginDataCallback} changeLoginMode={modeFunc} errorMessage={loginError} />;
            case "reset":
                return <ResetForm username={loginData.username} password={loginData.password} changeLoginData={loginDataCallback} changeLoginMode={modeFunc} />;
            case "mFTextInput":
                return <MFAText username={loginData.username} password={loginData.password} changeLoginData={loginDataCallback} changeLoginMode={modeFunc} />;
            case "mFWait":
                return <MFAWait username={loginData.username} password={loginData.password} changeLoginData={loginDataCallback} changeLoginMode={modeFunc} />;
            case "mFURL":
                return <MFAURL username={loginData.username} password={loginData.password} changeLoginData={loginDataCallback} changeLoginMode={modeFunc} />;
            default:
                return <LoginForm username={loginData.username} password={loginData.password} changeLoginData={loginDataCallback} changeLoginMode={modeFunc} errorMessage={loginError} />;

        }
    }
    
    // If there is a desktop-panel, render it and the login mask "above" it, if not, just display the login mask
    return (
        (context.appSettings.desktopPanel) ?
            <ResizeProvider login={true}>
                <ResizeHandler>
                    <div className="rc-glasspane login-glass" />
                    <div className="login-container-with-desktop" ref={sizeRef}>
                        {componentHandler(context.appSettings.desktopPanel as BaseComponent, context.contentStore)}
                        <div className="login-form-position-wrapper">
                            {getCorrectLoginForm()}
                        </div>
                    </div>
                </ResizeHandler>
            </ResizeProvider>
            :
            <div className="login-container">
                {getCorrectLoginForm()}
            </div>
    )
}
export default Login;