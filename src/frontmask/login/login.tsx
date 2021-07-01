/** React imports */
import React, { FC, FormEvent, useContext, useEffect, useState } from "react";

/** 3rd Party imports */
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Dialog } from 'primereact/dialog';

/** Hook imports */
import { useTranslation } from "../../main/components/zhooks";

/** Other imports */
import { appContext } from "../../main/AppProvider";
import { REQUEST_ENDPOINTS } from "../../main/request";
import { createLoginRequest } from "../../main/factories/RequestFactory";
import { showTopBar, TopBarContext } from "../../main/components/topbar/TopBar";
import ChangePasswordDialog from "../changePassword/ChangePasswordDialog";


/** Component which handles logging in */
const Login: FC = () => {
    /** Current state of username */
    const [username, setUsername] = useState<string>("");

    /** Current state of password */
    const [password, setPassword] = useState<string>("");

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Current state of translations */
    const translations = useTranslation()

    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);

    /**
     * Sends a loginrequest to the server when the loginform is submitted.
     */
    const loginSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const loginReq = createLoginRequest();
        loginReq.username = username;
        loginReq.password = password;
        loginReq.mode = "manual";
        showTopBar(context.server.sendRequest(loginReq, REQUEST_ENDPOINTS.LOGIN), topbar)
        context.subscriptions.emitRegisterCustom();
        context.subscriptions.emitMenuUpdate();
    }

    return(
        <div className="login-container">
            <ChangePasswordDialog 
                username={username} 
                password={password} 
                loggedIn={false} />
            <form onSubmit={loginSubmit} className="login-form">
                <div className="login-logo-wrapper">
                    <img className="login-logo" src={(process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.contentStore.LOGO_LOGIN} alt="logo" />
                </div>
                <div className="p-fluid">
                    <div className="p-field p-float-label p-input-icon-left">
                        <i className="pi pi-user" />
                        <InputText
                            value={username}
                            id="username"
                            type="text"
                            autoComplete="username"
                            onChange={(userEvent: React.ChangeEvent<HTMLInputElement>) => setUsername(userEvent.target.value)}/>
                        <label htmlFor="username">{translations.get("Username")} </label>
                    </div>
                    <div className="p-field p-float-label p-input-icon-left">
                        <i className="pi pi-key" />
                        <InputText
                            value={password}
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            onChange={(passEvent: React.ChangeEvent<HTMLInputElement>) => setPassword(passEvent.target.value)}/>
                        <label htmlFor="password">{translations.get("Password")} </label>
                    </div>
                    <Button type="submit" className="p-primary login-button" label={translations.get("Login")} icon="pi pi-lock-open"/>
                </div>
                
            </form>
        </div>
    )
}
export default Login;