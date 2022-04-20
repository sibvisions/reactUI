import React, { CSSProperties, FC, useContext, useEffect, useLayoutEffect, useState } from "react";
import { Button } from "primereact/button";
import tinycolor from "tinycolor2";
import { useConstants } from "../../moduleIndex";
import { LoginContext } from "./Login";
import { ILoginForm } from "./LoginForm";

/**
 * Returns the Multi-Factor-Authentication Mask for a Code authentication
 * @param props - the properties contains a function to change the login-mode
 */
const MFAWait:FC<ILoginForm> = (props) => {
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
                <div className="p-field" style={{ textAlign: "center" }} >
                    {translations.get("Matching code")}
                </div>
                <div className="p-field" style={{ fontSize: "1rem", fontWeight: "bold", textAlign: "center", marginBottom: "2rem" }} >
                    {code}
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
                        onClick={() => props.changeLoginMode("default")} />
                </div>
            </div>
        </div>
    )
}
export default MFAWait;