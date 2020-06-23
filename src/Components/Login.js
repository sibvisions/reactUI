import React, {Component} from 'react';
import {InputText} from 'primereact/inputtext';
import {Password} from 'primereact/password';
import "./Login.css"
import { Button } from 'primereact/button';
import {Checkbox} from 'primereact/checkbox';
import { Redirect } from 'react-router-dom';
import logo from './imgs/sibvisionslogo.png'

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

    handleClick() {
        if(this.state.username === 'admin' && this.state.password === 'admin') {
            this.setState({loggedIn: true})
        }
        else {
            alert("falscher Benutzername oder Passwort")
        }
    }

    render() {
        if(this.state.loggedIn === true) {
            return <Redirect to='/' />
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