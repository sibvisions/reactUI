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
                <div className="p-fluid">
                    <div className="p-field">
                        <label htmlFor="username">Username: </label>
                        <InputText
                            value={username}
                            id="username"
                            type="text"
                            autoComplete="username"
                            onChange={(userEvent: React.ChangeEvent<HTMLInputElement>) => changeUsername(userEvent.target.value)}/>
                    </div>
                    <div className="p-field">
                        <label htmlFor="password">Password: </label>
                        <InputText
                            value={password}
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            onChange={(passEvent: React.ChangeEvent<HTMLInputElement>) => changePassword(passEvent.target.value)}/>
                    </div>
                </div>
                <Button type="submit" className="p-primary login-button" label="Log in"/>
            </form>
        </div>
    )
}
export default Login;