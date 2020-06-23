import React, {Component} from 'react';
import {InputText} from 'primereact/inputtext';
import {Password} from 'primereact/password';
import "./Login.css"
import { Button } from 'primereact/button';
import {Checkbox} from 'primereact/checkbox';
import { Redirect } from 'react-router-dom';
import logo from './imgs/sibvisionslogo.png'

import { logIn, sender } from "../handling/TowerV2";

class LoginComponent extends Component {
    constructor(props) {
        super(props)
        this.state = {
            username: '',
            password: '',
            staySignedIn: false,
            loggedIn: false,
            displaySettings: false
        };
        this.handleClick = this.handleClick.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event) {
        const target = event.target;
        const id = target.id
        this.setState({
            [id]: target.value
        })
    }

    componentDidMount() {
        let info = {
            "layoutMode" : "generic",
            "appMode" : "full",
            "applicationName" : "demo"
        }; sender("/api/startup", info, this);
    }

    handleClick() {
        logIn(this.state.username, this.state.password);
        this.setState({loggedIn:true})
    }

    render() {
        if(this.state.loggedIn === true) {
            return <Redirect to='/content' />
        }
        return (
            <div className="background">
                <div className="loginmask">
                    <div className="upperMask">
                        <img src={logo} alt="firmenlogo"/>
                        <h3>Projektname</h3>
                    </div>
                    <span className="p-float-label">
                        <InputText id="username" type="text" value={this.state.username} onChange={this.handleChange} />
                        <label htmlFor="username">Benutzername:</label>
                    </span>
                    <Password id="password" placeholder="Passwort:" type="text" feedback={false} value={this.state.password} onChange={this.handleChange}/>
                    <div className="checkStay">
                        <Checkbox checked={this.state.staySignedIn} onChange={e => this.setState({staySignedIn: e.checked})}></Checkbox>
                        <label className="p-checkbox-label">Angemeldet bleiben?</label>
                    </div>
                    <Button id="loginbtn" label="ANMELDEN" className="p-button-raised" onClick={this.handleClick} />
                </div>
            </div>
        )
    }
}
export default LoginComponent;