import React, { CSSProperties, FC, useLayoutEffect, useMemo, useState } from "react";
import { Button } from "primereact/button";
import tinycolor from "tinycolor2";
import { createCancelLoginRequest, useConstants } from "../../moduleIndex";
import { ILoginForm } from "./LoginForm";
import { showTopBar } from "../../main/components/topbar/TopBar";
import { REQUEST_KEYWORDS } from "../../main/request";
import { MFAURLType } from "../../main/response/login/LoginResponse";
import UIGauge, { GAUGE_STYLES } from "../../main/components/gauge/UIGauge";

/**
 * Returns the Multi-Factor-Authentication Mask for a Code authentication
 * @param props - the properties contains a function to change the login-mode
 */
const MFAURL: FC<ILoginForm> = (props) => {
    /** Returns utility variables */
    const [context, topbar, translations] = useConstants();

    /** State of the email field */
    const [link, setLink] = useState<MFAURLType | string>({ width: 500, height: 300, url: "", target: "_self" });

    /** State of the timeout until the wait is invalid */
    const [loginTimeout, setLoginTimeout] = useState<number>(300000);

    /** State of the lapsed time during the wait */
    const [remainingTime, setRemainingTime] = useState<number>(loginTimeout);

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

    useLayoutEffect(() => {
        context.subscriptions.subscribeToMFAURL((link: string | MFAURLType, timeout: number) => {
            setLink(link);
            setLoginTimeout(timeout);
            setRemainingTime(timeout)
        });

        const intervalId = setInterval(() => {
            setRemainingTime(prevTime => prevTime - 1000);
        }, 1000);

        return () => {
            context.subscriptions.unsubscribeFromMFAURL();
            clearInterval(intervalId);
        }
    }, [])

    return (
        <div className="login-form">
            <div className="login-logo-wrapper">
                <img className="login-logo" src={(process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.appSettings.LOGO_LOGIN} alt="logo" />
            </div>
            <div className="p-fluid">
                <div className="p-field url-topper">
                    <div style={{ fontSize: "1.125rem", fontWeight: "bold", marginRight: "2rem" }} >
                        {translations.get("Waiting for verification.")}
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
                    {typeof link === "object" && link.target === "_self" ? <iframe 
                        src={typeof link === "string" ? link : link.url} 
                        style={iFrameStyle} /> : <a href={link as string} />}
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
export default MFAURL;