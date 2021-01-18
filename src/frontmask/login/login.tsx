import React, {FC, FormEvent, useContext, useState} from "react";

import {InputText} from "primereact/inputtext";
import {Button} from "primereact/button";
import {jvxContext} from "../../JVX/jvxProvider";
import REQUEST_ENDPOINTS from "../../JVX/request/REQUEST_ENDPOINTS";
import {createLoginRequest} from "../../JVX/factories/RequestFactory";


const Login: FC = () => {
    const [username, changeUsername] = useState<string>("");
    const [password, changePassword] = useState<string>("");
    const context = useContext(jvxContext);

    const loginSubmit = (props: FormEvent<HTMLFormElement>) => {
        props.preventDefault();
        let loginRequestBody = createLoginRequest();
        loginRequestBody.username= username;
        loginRequestBody.password= password;
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
                            onChange={(userEvent: React.ChangeEvent<HTMLInputElement>) => changeUsername(userEvent.target.value)}/>
                        <label htmlFor="username">Username </label>
                    </div>
                    <div className="p-field p-float-label p-input-icon-left">
                        <i className="pi pi-key" />
                        <InputText
                            value={password}
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            onChange={(passEvent: React.ChangeEvent<HTMLInputElement>) => changePassword(passEvent.target.value)}/>
                        <label htmlFor="password">Password </label>
                    </div>
                    <Button type="submit" className="p-primary login-button" label="Login" icon="pi pi-lock-open"/>
                </div>
                
            </form>
        </div>
    )
}
export default Login;