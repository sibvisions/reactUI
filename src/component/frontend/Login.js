import React, {Component} from 'react';
import "./Login.scss"
import { Button } from 'primereact/button';
import {Checkbox} from 'primereact/checkbox';
import {InputText} from 'primereact/inputtext';
import {Password} from 'primereact/password';
import { withRouter } from 'react-router-dom';

import { RefContext } from "../helper/Context";



class Login extends Component {
    state = {  }


    render() { 
        return (
            <div className="background">
                <div className="loginmask">
                    <div className="upperMask">
                        <img src={process.env.PUBLIC_URL + '/assets/sibvisionslogo.png'} alt="firmenlogo"/>
                    </div>
                    <span className="p-float-label">
                        <InputText id="username" type="text" value={this.state.username} onChange={this.handleChange} />
                        <label htmlFor="username">Benutzername:</label>
                    </span>
                    <Password id="password" placeholder="Passwort:" type="text" feedback={false} value={this.state.password} onChange={this.handleChange}/>
                    <Button id="loginbtn" label="ANMELDEN" className="p-button-raised" onClick={() => this.context.serverComm.logIn("features", "features")} />
                </div>
            </div>
        );
    }
}
Login.contextType = RefContext;
export default withRouter(Login);