import React, {Component} from 'react';
import "./Login.scss"
import { Button } from 'primereact/button';
import {Checkbox} from 'primereact/checkbox';
import {InputText} from 'primereact/inputtext';
import {Password} from 'primereact/password';
import { Redirect } from 'react-router-dom';
import logo from './imgs/sibvisionslogo.png'

import { logIn, sender } from "../handling/TowerV2";

class LoginComponent extends Component {
    /**
     * Constructor with state variables and bindings
     * @param {*} props default contructor with props
     */
    constructor(props) {
        super(props)
        this.state = {
            username: '',
            password: '',
            staySignedIn: false
        };
        this.handleClick = this.handleClick.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    /**
     * Dynamically changes the state values so you can see them on screen
     * @param {*} event "onChange" event
     */
    handleChange(event) {
        const target = event.target;
        const id = target.id
        this.setState({
            [id]: target.value
        })
    }

    /**
     * When the login component gets mounted, check if there is a client id in the localstorage. If there isn't send startup
     */
    componentDidMount() {
        if(!localStorage.getItem('clientId')) {
            let info = {
                "layoutMode" : "generic",
                "appMode" : "full",
                "applicationName" : "demo"
            }; sender("/api/startup", info, this);
        }
    }

    /**
     * call login method on button click, loggedIn state gets set in App
     */
    handleClick() {
        logIn(this.state.username, this.state.password);
        this.props.setLoggedIn();
    }

    /**
     * Renders the login component, if loggedIn in App is true, redirect to the content page
     */
    render() {
        if(this.props.loggedIn === true) {
            return <Redirect to='/content' />
        }
        return (
            <div className="background">
                <div className="loginmask">
                    <div className="upperMask">
                        <img src={logo} alt="firmenlogo"/>
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