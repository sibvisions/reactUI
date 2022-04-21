import React, { CSSProperties, FC, useLayoutEffect, useState } from "react";
import { Button } from "primereact/button";
import tinycolor from "tinycolor2";
import { createCancelLoginRequest, useConstants } from "../../moduleIndex";
import { ILoginForm } from "./LoginForm";
import { showTopBar } from "../../main/components/topbar/TopBar";
import { REQUEST_KEYWORDS } from "../../main/request";

/**
 * Returns the Multi-Factor-Authentication Mask for a Code authentication
 * @param props - the properties contains a function to change the login-mode
 */
const MFAURL:FC<ILoginForm> = (props) => {
    /** Returns utility variables */
    const [context, topbar, translations] = useConstants();

    /** State of the email field */
    const [code, setCode] = useState<string>("");

    /** The button background-color, taken from the "primary-color" variable of the css-scheme */
    const btnBgd = window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color');

    useLayoutEffect(() => {
        context.subscriptions.subscribeToLoginConfCode((confCode:string) => setCode(confCode));

        return () => context.subscriptions.unsubscribeFromLoginConfCode();
    }, [])

    return (
        <div className="login-form">
            <div className="login-logo-wrapper">
                <img className="login-logo" src={(process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.appSettings.LOGO_LOGIN} alt="logo" />
            </div>
            <div className="p-fluid">
                <div className="p-field" style={{ fontSize: "1rem", fontWeight: "bold" }} >
                    {translations.get("Verification")}
                </div>
                <div className="p-field" style={{ marginBottom: "2rem" }} >
                    {translations.get("Waiting for varification.")}
                </div>
                <div className="p-field" style={{ fontSize: "1rem", fontWeight: "bold", textAlign: "center", marginBottom: "2rem" }} >
                    <iframe src={code} style={{ width: "500px", height: "300px" }} />
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