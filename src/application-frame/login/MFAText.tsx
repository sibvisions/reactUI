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
import React, { CSSProperties, FC, useContext, useMemo, useState } from "react";
import { createCancelLoginRequest, createLoginRequest } from "../../main/factories/RequestFactory";
import tinycolor from "tinycolor2";
import { showTopBar } from "../../main/components/topbar/TopBar";
import { ILoginForm } from "./LoginForm";
import REQUEST_KEYWORDS from "../../main/request/REQUEST_KEYWORDS";
import { translation } from "../../main/util/other-util/Translation";
import useButtonBackground from "../../main/hooks/style-hooks/useButtonBackground";
import useDesignerUpdates from "../../main/hooks/style-hooks/useDesignerUpdates";
import { appContext } from "../../main/contexts/AppProvider";
import { FloatLabel } from "primereact/floatlabel";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";

/**
 * Returns the Multi-Factor-Authentication Mask for a TextInput authentication
 * @param props - the properties contains a function to change the login-mode
 */
const MFAText:FC<ILoginForm> = (props) => {
    /** Returns utility variables */
    const context = useContext(appContext);

    /** State of the email field */
    const [code, setCode] = useState<string>("");

    /** Subscribes to designer-changes so the components are updated live */
    useDesignerUpdates("default-button");

    /** Updates the button background live */
    const bgdUpdate = useButtonBackground();

    /** The button background-color, taken from the "primary-color" variable of the css-scheme */
    const btnBgd = useMemo(() => window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color'), [bgdUpdate]);

    // Sends a login-request with the confirmation-code to the server
    const sendAuthCode = () => {
        if (!code) {
            context.subscriptions.emitToast({ message: translation.get("The authentication code is required"), name: "" });
        }
        else {
            const codeReq = createLoginRequest();
            codeReq.username = props.username;
            codeReq.password = props.password;
            codeReq.mode = "mFTextInput";
            codeReq.confirmationCode = code;
            showTopBar(context.server.sendRequest(codeReq, REQUEST_KEYWORDS.LOGIN), context.server.topbar)
        }
    }

    return (
        <form onSubmit={sendAuthCode} className="login-form">
            <div className="login-logo-wrapper">
                <img className="login-logo" src={'.' + context.appSettings.LOGO_LOGIN} alt="logo" />
            </div>
            <div className="p-fluid">
                <div className="p-field" style={{ fontSize: "1.5rem", fontWeight: "bold" }} >
                    {translation.get("Verification")}
                </div>
                <div className="p-field" style={{ marginBottom: "1rem" }}>
                    {translation.get("Please enter your confirmation code.")}
                </div>
                {/*@ts-ignore*/}
                <FloatLabel>
                    <IconField iconPosition="left">
                        <InputIcon className="pi pi-key" />
                        <InputText
                            value={code}
                            className="login-inputtext"
                            id="code"
                            type="text"
                            autoComplete="code"
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setCode(event.target.value)} />
                    </IconField>
                    <label htmlFor="code">{translation.get("Code")} </label>
                </FloatLabel>
                <div className="change-password-button-wrapper" style={{ marginTop: "2rem" }}>
                    <Button 
                        type="button" 
                        className="lost-password-button rc-button" 
                        style={{
                            '--background': btnBgd,
                            '--hoverBackground': tinycolor(btnBgd).darken(5).toString()
                        } as CSSProperties}
                        label={translation.get("Cancel")} 
                        icon="pi pi-times" 
                        onClick={() => {
                            showTopBar(context.server.sendRequest(createCancelLoginRequest(), REQUEST_KEYWORDS.CANCEL_LOGIN), context.server.topbar);
                            props.changeLoginMode("default")
                        }}
                        disabled={props.loginActive} />
                    <Button 
                        type="submit" 
                        className="lost-password-button rc-button"
                        style={{
                            '--background': btnBgd,
                            '--hoverBackground': tinycolor(btnBgd).darken(5).toString()
                        } as CSSProperties}
                        label={translation.get("Confirm")} 
                        icon="pi pi-send"
                        disabled={props.loginActive} />
                </div>
            </div>
        </form>
    )
}
export default MFAText;