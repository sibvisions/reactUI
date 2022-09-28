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
import { MFAURLType } from "../../main/response/login/LoginResponse";
import UIGauge, { GAUGE_STYLES } from "../../main/components/gauge/UIGauge";
import { createCancelLoginRequest } from "../../main/factories/RequestFactory";
import REQUEST_KEYWORDS from "../../main/request/REQUEST_KEYWORDS";
import useConstants from "../../main/hooks/components-hooks/useConstants";
import { translation } from "../../main/util/other-util/Translation";

/**
 * Returns the Multi-Factor-Authentication Mask for a Code authentication
 * @param props - the properties contains a function to change the login-mode
 */
const MFAURL: FC<ILoginForm> = (props) => {
    /** Returns utility variables */
    const [context, topbar] = useConstants();

    /** State of the link object */
    const [link, setLink] = useState<MFAURLType | string>({ width: 500, height: 300, url: "", target: "_self" });

    /** State of the timeout until the wait is invalid */
    const [loginTimeout, setLoginTimeout] = useState<number>(300000);

    /** State of the lapsed time during the wait */
    const [remainingTime, setRemainingTime] = useState<number>(loginTimeout);

    const [restart, setRestart] = useState<boolean|undefined>(undefined);

    const intervalId = useRef<any>(null);

    /** Sets the style for the iFrame, default or based on the link state */
    const iFrameStyle: CSSProperties = useMemo(() => {
        const style:CSSProperties = { border: "1px solid" };
        if (typeof link === "object") {
            if (link.width) {
                style.width = link.width + "px";
            }
            else {
                style.width = "500px";
            }

            if (link.height) {
                style.height = link.height + "px";
            }
            else {
                style.height = "300px";
            }
        }
        else {
            style.width = "500px";
            style.height = "300px";
        }
        return style
    }, [link])

    /** The button background-color, taken from the "primary-color" variable of the css-scheme */
    const btnBgd = window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color');

    // Subscribes to the link object and timeout sent by the server. And starts the MFA timer
    useLayoutEffect(() => {
        context.subscriptions.subscribeToMFAURL((pLink: string | MFAURLType, timeout: number) => {
            if (typeof link === "object") {
                const newLink:MFAURLType = {...link};
                const castedParameter = pLink as MFAURLType

                if (castedParameter.height !== undefined) {
                    newLink.height = castedParameter.height;
                }
                if (castedParameter.width !== undefined) {
                    newLink.width = castedParameter.width
                }
                if (castedParameter.target !== undefined) {
                    newLink.target = castedParameter.target;
                }
                if (castedParameter.url !== undefined) {
                    newLink.url = castedParameter.url
                }
                setLink(newLink);
            }
            else {
                setLink(pLink);
            }
            
            if (timeout !== loginTimeout) {
                setLoginTimeout(timeout);
                setRemainingTime(timeout);
            }
        });

        intervalId.current = setInterval(() => {
            setRemainingTime(prevTime => prevTime - 1000);
        }, 1000);

        return () => {
            context.subscriptions.unsubscribeFromMFAURL();
            clearInterval(intervalId.current);
        }
    }, []);

    useEffect(() => {
        if ((typeof link === "object" && link.url !== "") || link !== "") {
            clearInterval(intervalId.current)
            setRemainingTime(loginTimeout);
            setRestart(prevState => prevState === undefined ? true : !prevState);
        }
    }, [link])

    useEffect(() => {
        if (restart !== undefined) {
            intervalId.current = setInterval(() => setRemainingTime(prevTime => prevTime - 1000), 1000);
        }
    }, [restart])

    return (
        <div className="login-form">
            <div className="login-logo-wrapper">
                <img className="login-logo" src={(process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.appSettings.LOGO_LOGIN} alt="logo" />
            </div>
            <div className="p-fluid">
                <div className="p-field url-topper">
                    <div style={{ fontSize: "1.125rem", fontWeight: "bold", marginRight: "2rem" }} >
                        {translation.get("Waiting for verification.")}
                    </div>
                    <UIGauge
                        id="login-gauge"
                        name="login-gauge-url"
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
                </div>
                <div className="p-field" style={{ fontSize: "1rem", fontWeight: "bold", textAlign: "center", marginBottom: "2rem" }} >
                    {typeof link === "object" && link.target === "_self" ? 
                    <iframe src={link.url} style={iFrameStyle} /> : <a href={link as string} />}
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
export default MFAURL;