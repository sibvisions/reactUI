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

import React, { CSSProperties, FC, useEffect, useMemo, useState, ReactElement } from "react";
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
import { Button } from "primereact/button";
import tinycolor from "tinycolor2";
import { ReactUIDesigner } from "@sibvisions/reactui-designer";
import useDesignerImages from "../../main/hooks/style-hooks/useDesignerImages";
import { isCorporation } from "../../main/util/server-util/IsCorporation";
import ContentStore from "../../main/contentstore/ContentStore";
import { showTopBar } from "../../main/components/topbar/TopBar";
import REQUEST_KEYWORDS from "../../main/request/REQUEST_KEYWORDS";
import useConstants from "../../main/hooks/components-hooks/useConstants";
import { createLoginRequest, createResetPasswordRequest } from "../../main/factories/RequestFactory";

/** 
 * Type for the different login-modes
 */
type LoginMode = "default"|"reset"|"mFTextInput"|"mFWait"|"mFURL";

export type ICustomLogin = {
    username: string,
    password: string,
    sendLoginRequest: (username: string, password: string, rememberMe?:boolean) => void,
    sendResetRequest: (identifier: string) => void,
    loginMode: LoginMode,
    setToDefaultLoginMode: () => void,
    setToResetLoginMode: () => void
}

/** Component which handles logging in */
const Login: FC = () => {
    /** Returns utility variables */
    const [context, topbar] = useConstants();

    /** Reference for the screen-container */
    //const sizeRef = useRef<any>(null);

    /** State of the current login-mode to display */
    const [loginMode, setLoginMode] = useState<LoginMode>("default");

    /** State of the login error, undefined unless there is an error to display */
    const [loginError, setLoginError] = useState<string|undefined>(context.server.loginError);

    /** State of the login-data entered */
    const [loginData, setLoginData] = useState<ILoginCredentials>({ username: "", password: "" });

    const [showDesignerView, setShowDesignerView] = useState<boolean>(false);

    const setImagesChanged = useDesignerImages("login");

    /** The currently used app-layout */
    const appLayout = useMemo(() => context.appSettings.applicationMetaData.applicationLayout.layout, [context.appSettings.applicationMetaData]);

    /** The current app-theme e.g. "basti" */
    const [appTheme, setAppTheme] = useState<string>(context.appSettings.applicationMetaData.applicationTheme.value);
    
    useEffect(() => {
        context.subscriptions.subscribeToTheme("login", (theme:string) => setAppTheme(theme));

        return () => context.subscriptions.unsubscribeFromTheme("login");
    }, [context.subscriptions])

    // Subscribes to the login-mode and login-error
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

    useEffect(() => {
        const docStyle = window.getComputedStyle(document.documentElement)
        const mainHeight = docStyle.getPropertyValue('--main-height');
        const mainWidth = docStyle.getPropertyValue('--main-width');
        if (showDesignerView) {
            if (mainHeight === "100vh") {
                document.documentElement.style.setProperty("--main-height", 
                `calc(100vh - ${docStyle.getPropertyValue('--designer-topbar-height')} - ${docStyle.getPropertyValue('--designer-content-padding')} - ${docStyle.getPropertyValue('--designer-content-padding')})`);
            }

            if (mainWidth === "100vw") {
                document.documentElement.style.setProperty("--main-width", `calc(100vw - ${docStyle.getPropertyValue('--designer-panel-wrapper-width')} - ${docStyle.getPropertyValue('--designer-content-padding')} - ${docStyle.getPropertyValue('--designer-content-padding')})`);
            }
        }
        else {
            if (mainHeight !== "100vh") {
                document.documentElement.style.setProperty("--main-height", "100vh");
            }

            if (mainWidth !== "100vw") {
                document.documentElement.style.setProperty("--main-width", "100vw");
            }
        }
    }, [showDesignerView])

    // Renders the correct login-form and passes a function to change the login-mode and to change login-data
    const getCorrectLoginForm = () => {
        const modeFunc = (mode:LoginMode) => setLoginMode(mode);

        const loginDataCallback = (username: string, password: string) => setLoginData({ username: username, password: password });

        const customLoginRequest = (username: string, password: string, rememberMe?:boolean, options?: any) => {
            setLoginData({ username: username, password: password });
            let loginReq = createLoginRequest();
            loginReq.username = username;
            loginReq.password = password;
            loginReq.mode = "manual";
            if (rememberMe !== undefined) {
                loginReq.createAuthKey = rememberMe;
            }

            if (options !== undefined) {
                loginReq = { ...options, ...loginReq };
            }

            context.subscriptions.emitLoginChanged(undefined, undefined);
            showTopBar(context.server.sendRequest(loginReq, REQUEST_KEYWORDS.LOGIN), topbar)
        }

        const customResetRequest = (identifier: string, options?: any) => {
            let resetReq = createResetPasswordRequest();
            resetReq.identifier = identifier;

            if (options !== undefined) {
                resetReq = { ...options, ...resetReq };
            }

            showTopBar(context.server.sendRequest(resetReq, REQUEST_KEYWORDS.RESET_PASSWORD), topbar)
        }

        let customLoginView:{
            elem: ((props: ICustomLogin) => ReactElement) | undefined;
            useDefault: boolean;
            useReset: boolean;
            useTextMFA: boolean;
            useWaitMFA: boolean;
            useURLMFA: boolean;
        } | undefined = undefined;

        if (context.appSettings.transferType !== "full" && (context.contentStore as ContentStore).customLoginView.elem !== undefined) {
            customLoginView = (context.contentStore as ContentStore).customLoginView;
        }

        const getCustomLoginElem = () => {
            if (customLoginView && customLoginView.elem) {
                return customLoginView.elem.apply(undefined, [{
                     username: loginData.username,
                     password: loginData.password,
                     loginMode: loginMode,
                     sendLoginRequest: customLoginRequest,
                     sendResetRequest: customResetRequest,
                     setToDefaultLoginMode: () => setLoginMode("default"),
                     setToResetLoginMode: () => setLoginMode("reset")
                }])
            }
        }
        
        switch (loginMode) {
            case "default":
                if (customLoginView?.useDefault) {
                    return getCustomLoginElem();
                }
                else {
                    return <LoginForm username={loginData.username} password={loginData.password} changeLoginData={loginDataCallback} changeLoginMode={modeFunc} errorMessage={loginError} />;
                }
                
            case "reset":
                if (customLoginView?.useReset) {
                    return getCustomLoginElem();
                }
                else {
                    return <ResetForm username={loginData.username} password={loginData.password} changeLoginData={loginDataCallback} changeLoginMode={modeFunc} />;
                }
            case "mFTextInput":
                if (customLoginView?.useTextMFA) {
                    return getCustomLoginElem();
                }
                else {
                    return <MFAText username={loginData.username} password={loginData.password} changeLoginData={loginDataCallback} changeLoginMode={modeFunc} />;
                }
                
            case "mFWait":
                if (customLoginView?.useWaitMFA) {
                    return getCustomLoginElem();
                }
                else {
                    return <MFAWait username={loginData.username} password={loginData.password} changeLoginData={loginDataCallback} changeLoginMode={modeFunc} />;
                }
            case "mFURL":
                if (customLoginView?.useURLMFA) {
                    return getCustomLoginElem();
                }
                else {
                    return <MFAURL username={loginData.username} password={loginData.password} changeLoginData={loginDataCallback} changeLoginMode={modeFunc} />;
                }
                
            default:
                return <LoginForm username={loginData.username} password={loginData.password} changeLoginData={loginDataCallback} changeLoginMode={modeFunc} errorMessage={loginError} />;

        }
    }

    const content = 
        (context.appSettings.desktopPanel) ?
        <>
            <ResizeProvider login={true}>
                <ResizeHandler>
                    <div className="rc-glasspane login-glass" />
                        {componentHandler(context.appSettings.desktopPanel as BaseComponent, context.contentStore)}
                        <div className="login-form-position-wrapper">
                            {getCorrectLoginForm()}
                        </div>
                </ResizeHandler>
            </ResizeProvider>
            {context.appSettings.showDesigner && 
                <Button 
                    className="p-button-raised p-button-rounded rc-button designer-button" 
                    icon="fas fa-palette"
                    style={{ 
                        "--background": window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color'), 
                        "--hoverBackground": tinycolor(window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color')).darken(5).toString(),
                        width: "4rem",
                        height: "4rem",
                        position: "absolute", 
                        top: "calc(100% - 100px)", 
                        left: "calc(100% - 90px)", 
                        opacity: "0.8",
                        fontSize: "1.825rem",
                    } as CSSProperties}
                    onClick={() => setShowDesignerView(prevState => !prevState)}  />}
        </>

        :
        <div className="login-container">
            {getCorrectLoginForm()}
        </div>
    
    // If there is a desktop-panel, render it and the login mask "above" it, if not, just display the login mask
    return (
        (showDesignerView) ?
            <ReactUIDesigner 
                isLogin 
                changeImages={() => setImagesChanged(prevState => !prevState)} 
                uploadUrl={context.server.designerUrl} 
                isCorporation={isCorporation(appLayout, appTheme)}
                logoLogin={process.env.PUBLIC_URL + context.appSettings.LOGO_LOGIN}
                logoBig={process.env.PUBLIC_URL + context.appSettings.LOGO_BIG}
                logoSmall={process.env.PUBLIC_URL + context.appSettings.LOGO_SMALL}
                designerSubscription={context.designerSubscriptions}
                appName={context.appSettings.applicationMetaData.applicationName}>
                {content}
            </ReactUIDesigner> 
            :
            <>
                {content}
            </>
    )
}
export default Login;