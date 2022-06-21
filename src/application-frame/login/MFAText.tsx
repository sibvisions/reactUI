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
import { InputText } from "primereact/inputtext";
import React, { CSSProperties, FC, useState } from "react";
import { createCancelLoginRequest, createLoginRequest } from "../../main/factories/RequestFactory";
import tinycolor from "tinycolor2";
import { showTopBar } from "../../main/components/topbar/TopBar";
import { ILoginForm } from "./LoginForm";
import useConstants from "../../main/hooks/components-hooks/useConstants";
import REQUEST_KEYWORDS from "../../main/request/REQUEST_KEYWORDS";

/**
 * Returns the Multi-Factor-Authentication Mask for a TextInput authentication
 * @param props - the properties contains a function to change the login-mode
 */
const MFAText:FC<ILoginForm> = (props) => {
    /** Returns utility variables */
    const [context, topbar, translations] = useConstants();

    /** State of the email field */
    const [code, setCode] = useState<string>("");

    /** The button background-color, taken from the "primary-color" variable of the css-scheme */
    const btnBgd = window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color');

    const sendAuthCode = () => {
        if (!code) {
            context.subscriptions.emitToast({ message: translations.get("The authentication code is required"), name: "" });
        }
        else {
            const codeReq = createLoginRequest();
            codeReq.username = props.username;
            codeReq.password = props.password;
            codeReq.mode = "mFTextInput";
            codeReq.confirmationCode = code;
            showTopBar(context.server.sendRequest(codeReq, REQUEST_KEYWORDS.LOGIN), topbar)
        }
    }

    return (
        <form onSubmit={sendAuthCode} className="login-form">
            <div className="login-logo-wrapper">
                <img className="login-logo" src={(process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.appSettings.LOGO_LOGIN} alt="logo" />
            </div>
            <div className="p-fluid">
                <div className="p-field" style={{ fontSize: "1.5rem", fontWeight: "bold" }} >
                    {translations.get("Verification")}
                </div>
                <div className="p-field" style={{ marginBottom: "1rem" }}>
                    {translations.get("Please enter your confirmation code.")}
                </div>
                <div className="p-field p-float-label p-input-icon-left" style={{ marginBottom: "2rem" }}>
                    <i className="pi pi-key" />
                    <InputText
                        value={code}
                        id="code"
                        type="text"
                        autoComplete="code"
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => setCode(event.target.value)} />
                    <label htmlFor="code">{translations.get("Code")} </label>
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
                        onClick={() => {
                            showTopBar(context.server.sendRequest(createCancelLoginRequest(), REQUEST_KEYWORDS.CANCEL_LOGIN), topbar);
                            props.changeLoginMode("default")
                        }} />
                    <Button 
                        type="submit" 
                        className="lost-password-button rc-button"
                        style={{
                            '--background': btnBgd,
                            '--hoverBackground': tinycolor(btnBgd).darken(5).toString()
                        } as CSSProperties}
                        label={translations.get("Confirm")} 
                        icon="pi pi-send" />
                </div>
            </div>
        </form>
    )
}
export default MFAText;