import React, { CSSProperties, FC, useContext, useEffect, useLayoutEffect, useState } from "react";
import { Button } from "primereact/button";
import tinycolor from "tinycolor2";
import { createCancelLoginRequest, useConstants } from "../../moduleIndex";
import { LoginContext } from "./Login";
import { ILoginForm } from "./LoginForm";
import { showTopBar } from "../../main/components/topbar/TopBar";
import { REQUEST_KEYWORDS } from "../../main/request";
import UIGauge, { GAUGE_STYLES } from "../../main/components/gauge/UIGauge";

/**
 * Returns the Multi-Factor-Authentication Mask for a Code authentication
 * @param props - the properties contains a function to change the login-mode
 */
const MFAWait:FC<ILoginForm> = (props) => {
    /** Returns utility variables */
    const [context, topbar, translations] = useConstants();

    /** State of the email field */
    const [code, setCode] = useState<string>("");

    /** State of the timeout until the wait is invalid */
    const [loginTimeout, setLoginTimeout] = useState<number>(300000);

    /** State of the lapsed time during the wait */
    const [remainingTime, setRemainingTime] = useState<number>(loginTimeout);

    /** The button background-color, taken from the "primary-color" variable of the css-scheme */
    const btnBgd = window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color');

    useLayoutEffect(() => {
        context.subscriptions.subscribeToMFAWait((code:string, timeout:number) => {
            setCode(code);
            setLoginTimeout(timeout);
            setRemainingTime(timeout);
        });

        const intervalId = setInterval(() => {
            setRemainingTime(prevTime => prevTime - 1000);
          }, 1000);

        return () => {
            context.subscriptions.unsubscribeFromMFAWait()
            clearInterval(intervalId);
        };
    }, []);

    return (
        <div className="login-form">
            <div className="login-logo-wrapper">
                <img className="login-logo" src={(process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.appSettings.LOGO_LOGIN} alt="logo" />
            </div>
            <div className="p-fluid">
                <div className="p-field" style={{ fontSize: "1.5rem", fontWeight: "bold" }} >
                    {translations.get("Waiting for verification.")}
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
                            {translations.get("Matching code")}
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
                        label={translations.get("Cancel")} 
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