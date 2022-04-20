import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import React, { CSSProperties, FC, useState } from "react";
import tinycolor from "tinycolor2";
import { showTopBar } from "../../main/components/topbar/TopBar";
import { REQUEST_KEYWORDS } from "../../main/request";
import { createResetPasswordRequest, useConstants } from "../../moduleIndex";
import { ILoginForm } from "./LoginForm";

/**
 * Returns the reset-form to reset the password of a user.
 * @param props - the properties contains a function to change the login-mode
 */
const ResetForm:FC<ILoginForm> = (props) => {
    /** Returns utility variables */
    const [context, topbar, translations] = useConstants();

    /** State of the email field */
    const [email, setEmail] = useState<string>("");

    /** The button background-color, taken from the "primary-color" variable of the css-scheme */
    const btnBgd = window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color');

    /**
     * Sends a reset-password-request to the server, if a email is entered.
     */
     const sendResetPassword = () => {
        if (!email) {
            context.subscriptions.emitMessage({ message: translations.get("The email is required"), name: "" });
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
                    {translations.get("Please enter your e-mail address.")}
                </div>
                <div className="p-field p-float-label p-input-icon-left">
                    <i className="pi pi-inbox" />
                    <InputText
                        value={email}
                        id="email"
                        type="text"
                        autoComplete="email"
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)} />
                    <label htmlFor="email">{translations.get("Email")} </label>
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
                        onClick={() => props.changeLoginMode("default")} />
                    <Button 
                        type="submit" 
                        className="lost-password-button rc-button"
                        style={{
                            '--background': btnBgd,
                            '--hoverBackground': tinycolor(btnBgd).darken(5).toString()
                        } as CSSProperties}
                        label={translations.get("Request")} 
                        icon="pi pi-send" />
                </div>
            </div>
        </form>
    )
}
export default ResetForm