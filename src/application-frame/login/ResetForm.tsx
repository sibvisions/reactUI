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
import React, { CSSProperties, FC, FormEvent, useMemo, useState } from "react";
import { createResetPasswordRequest } from "../../main/factories/RequestFactory";
import tinycolor from "tinycolor2";
import { showTopBar } from "../../main/components/topbar/TopBar";
import { ILoginForm } from "./LoginForm";
import useConstants from "../../main/hooks/components-hooks/useConstants";
import REQUEST_KEYWORDS from "../../main/request/REQUEST_KEYWORDS";
import { translation } from "../../main/util/other-util/Translation";
import useDesignerUpdates from "../../main/hooks/style-hooks/useDesignerUpdates";
import useButtonBackground from "../../main/hooks/style-hooks/useButtonBackground";

/**
 * Returns the reset-form to reset the password of a user.
 * @param props - the properties contains a function to change the login-mode
 */
const ResetForm:FC<ILoginForm> = (props) => {
    /** Returns utility variables */
    const [context, topbar] = useConstants();

    /** State of the email field */
    const [email, setEmail] = useState<string>("");

    /** Subscribes to designer-changes so the components are updated live */
    useDesignerUpdates("default-button");

    /** Updates the button background live */
    const bgdUpdate = useButtonBackground();

    /** The button background-color, taken from the "primary-color" variable of the css-scheme */
    const btnBgd = useMemo(() => window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color'), [bgdUpdate]);

    /**
     * Sends a reset-password-request to the server, if a email is entered.
     */
     const sendResetPassword = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!email) {
            context.subscriptions.emitToast({ message: translation.get("The email is required"), name: "" });
        }
        else {
            const resetReq = createResetPasswordRequest();
            resetReq.identifier = email;
            showTopBar(context.server.sendRequest(resetReq, REQUEST_KEYWORDS.RESET_PASSWORD), topbar)
        }
    }

    return (
        <form onSubmit={sendResetPassword} className="login-form">
            <div className="login-logo-wrapper">
                <img className="login-logo" src={(process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.appSettings.LOGO_LOGIN} alt="logo" />
            </div>
            <div className="p-fluid">
                <div className="p-field" style={{ fontSize: "1rem", fontWeight: "bold" }} >
                    {translation.get("Please enter your e-mail address.")}
                </div>
                <div className="p-field p-float-label p-input-icon-left">
                    <i className="pi pi-inbox" />
                    <InputText
                        value={email}
                        id="email"
                        type="text"
                        autoComplete="email"
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)} />
                    <label htmlFor="email">{translation.get("Email")} </label>
                </div>
                <div className="change-password-button-wrapper">
                    <Button 
                        type="button" 
                        className="lost-password-button rc-button" 
                        style={{
                            '--background': btnBgd,
                            '--hoverBackground': tinycolor(btnBgd).darken(5).toString()
                        } as CSSProperties}
                        label={translation.get("Cancel")} 
                        icon="pi pi-times" 
                        onClick={() => props.changeLoginMode("default")}
                        disabled={props.loginActive} />
                    <Button 
                        type="submit" 
                        className="lost-password-button rc-button"
                        style={{
                            '--background': btnBgd,
                            '--hoverBackground': tinycolor(btnBgd).darken(5).toString()
                        } as CSSProperties}
                        label={translation.get("Request")} 
                        icon="pi pi-send"
                        disabled={props.loginActive} />
                </div>
            </div>
        </form>
    )
}
export default ResetForm