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

import React, { CSSProperties, FC, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button } from "primereact/button";
import tinycolor from "tinycolor2";
import { ILoginForm } from "./LoginForm";
import { showTopBar } from "../../main/components/topbar/TopBar";
import UIGauge, { GAUGE_STYLES } from "../../main/components/gauge/UIGauge";
import { createCancelLoginRequest } from "../../main/factories/RequestFactory";
import REQUEST_KEYWORDS from "../../main/request/REQUEST_KEYWORDS";
import useConstants from "../../main/hooks/components-hooks/useConstants";
import { translation } from "../../main/util/other-util/Translation";
import useDesignerUpdates from "../../main/hooks/style-hooks/useDesignerUpdates";
import useButtonBackground from "../../main/hooks/style-hooks/useButtonBackground";

/**
 * Returns the Multi-Factor-Authentication Mask for a Code authentication
 * @param props - the properties contains a function to change the login-mode
 */
const MFAWait:FC<ILoginForm> = (props) => {
    /** Returns utility variables */
    const [context, topbar] = useConstants();

    /** State of the code field */
    const [code, setCode] = useState<string>("");

    /** State of the timeout until the wait is invalid */
    const [loginTimeout, setLoginTimeout] = useState<number>(300000);

    /** State of the lapsed time during the wait */
    const [remainingTime, setRemainingTime] = useState<number>(loginTimeout);

    /** State flag which resets the timeout when the flag switches */
    const [timeoutReset, setTimeoutReset] = useState<boolean|undefined>(undefined);

    /** Subscribes to designer-changes so the components are updated live */
    useDesignerUpdates("default-button");

    /** Updates the button background live */
    const bgdUpdate = useButtonBackground();

    /** The button background-color, taken from the "primary-color" variable of the css-scheme */
    const btnBgd = useMemo(() => window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color'), [bgdUpdate]);

    /** Ref for the interval */
    const intervalId = useRef<any>(null);

    // Subscribes to the code and the timeout. And starts the timer
    useLayoutEffect(() => {
        context.subscriptions.subscribeToMFAWait("wait-comp", (code:string, timeout:number, timeoutReset?:boolean) => {
            setCode(code);

            setLoginTimeout(timeout);

            if (timeoutReset) {
                setTimeoutReset(prevState => prevState === undefined ? true : !prevState);
            }
        });

        intervalId.current = setInterval(() => setRemainingTime(prevTime => prevTime - 1000), 1000);

        return () => {
            context.subscriptions.unsubscribeFromMFAWait("wait-comp")
            clearInterval(intervalId.current);
        };
    }, []);

    // Sets the login-timeout if there is a new one.
    useEffect(() => {
        setRemainingTime(loginTimeout)
    }, [loginTimeout])

    // When the timeout resets, reset the interval
    useEffect(() => {
        if (timeoutReset !== undefined) {
            clearInterval(intervalId.current)
            setRemainingTime(loginTimeout);
            intervalId.current = setInterval(() => setRemainingTime(prevTime => prevTime - 1000), 1000);
        }
    }, [timeoutReset])

    return (
        <div className="login-form">
            <div className="login-logo-wrapper">
                <img className="login-logo" src={(process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.appSettings.LOGO_LOGIN} alt="logo" />
            </div>
            <div className="p-fluid">
                <div className="p-field" style={{ fontSize: "1.125rem", fontWeight: "bold" }} >
                    {translation.get("Waiting for verification.")}
                </div>
                <div className="p-field wait-code-container" >
                    <UIGauge
                        id="login-gauge"
                        name="login-gauge-wait"
                        className="ui-gauge"
                        constraints=""
                        title=""
                        gaugeStyle={GAUGE_STYLES.STYLE_RING}
                        minWarningValue={loginTimeout * 0.375}
                        maxWarningValue={loginTimeout + 1}
                        minErrorValue={loginTimeout * 0.125}
                        maxErrorValue={loginTimeout + 2}
                        maxValue={loginTimeout}
                        data={remainingTime}
                        dataBook=""
                        columnLabel="" />
                    <div className="wait-code-display">
                        <div className="p-field" style={{ textAlign: "center" }} >
                            {translation.get("Matching code")}
                        </div>
                        <div style={{ fontSize: "1rem", fontWeight: "bold", textAlign: "center" }} >
                            {code}
                        </div>
                    </div>
                </div>

                <div className="change-password-button-wrapper" style={{ justifyContent: "flex-end" }}>
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
                            showTopBar(context.server.sendRequest(createCancelLoginRequest(), REQUEST_KEYWORDS.CANCEL_LOGIN), topbar);
                            props.changeLoginMode("default")
                        }} />
                </div>
            </div>
        </div>
    )
}
export default MFAWait;