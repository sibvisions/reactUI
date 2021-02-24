/** React imports */
import React, {FC, FormEvent, useContext, useState} from "react";

/** 3rd Party imports */
import {InputText} from "primereact/inputtext";
import {Button} from "primereact/button";

/** Hook imports */
import useTranslation from "../../JVX/components/zhooks/useTranslation";

/** Other imports */
import {jvxContext} from "../../JVX/jvxProvider";
import REQUEST_ENDPOINTS from "../../JVX/request/REQUEST_ENDPOINTS";
import {createLoginRequest} from "../../JVX/factories/RequestFactory";


/** Component which handles logging in */
const Login: FC = () => {
    /** Current state of username */
    const [username, setUsername] = useState<string>("");
    /** Current state of password */
    const [password, setPassword] = useState<string>("");
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);
    /** Current state of translations */
    const translations = useTranslation()

    /**
     * Sends a loginrequest to the server when the loginform is submitted.
     */
    const loginSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        let loginRequestBody = createLoginRequest();
        loginRequestBody.username = username;
        loginRequestBody.password = password;
        context.server.sendRequest(loginRequestBody, REQUEST_ENDPOINTS.LOGIN);
    }

    return(
        <div className="login-container">
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