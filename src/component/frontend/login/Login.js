import React, {Component} from 'react';
import "./Login.scss"
import logo from "../../../assets/imgs/sibvisionslogo.png"
import background from "../../../assets/imgs/loginbackground.jpg"
import { Button } from 'primereact/button';
import {InputText} from 'primereact/inputtext';
import { withRouter } from 'react-router-dom';

import { RefContext } from "../../helper/Context";



class Login extends Component {
    state = {
        username: "",
        password: ""
    }

    submitLogin(event){
        event.preventDefault();
        this.context.serverComm.logIn(this.state.username, this.state.password);
    }

    handleUsernameChange(event){
        this.setState({username: event.target.value})
    }

    hanldePasswordChange(event){
        this.setState({password: event.target.value})
    }

    render() { 
        return (
            <div className="background" style={{backgroundImage: "url(" + background + ")"}}>
                <div className="loginmask">
                    <div className="upperMask">
                        <img id={"firmenlogo"} src={logo} alt="firmenlogo"/>
                    </div>
                    <form onSubmit={this.submitLogin.bind(this)}>
                        <span className="p-float-label">
                            <InputText autoComplete="username" id="username" value={this.state.username} onChange={this.handleUsernameChange.bind(this)} />    
                            <label htmlFor="username">Benutzername: </label>
                        </span>
                        <span className="p-float-label">
                            <InputText autoComplete="current-password" id="password" type="password" value={this.state.password} onChange={this.hanldePasswordChange.bind(this)} style={{margin: 0}}/>
                            <label htmlFor="password">Passwort: </label>
                        </span>
                        <Button id={'loginbtn'} className="p-button-raised" value="submit" label="ANMELDEN"/>
                    </form>
                    <Button className="p-buttom-secondary" id={'featbtn'} label="Log in as features" onClick={() => this.context.serverComm.logIn("features","features")} style={{marginTop:"10px"}}/>
                </div>
            </div>
        );
    }
}
Login.contextType = RefContext;
export default withRouter(Login);