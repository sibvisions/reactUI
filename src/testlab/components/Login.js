import React, { Component } from 'react';
import { Button } from 'primereact/button';
import { RefContext } from './Context';
import { withRouter } from 'react-router-dom';

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
                    <div className="checkStay">
                        <Checkbox checked={this.state.staySignedIn} onChange={e => this.setState({staySignedIn: e.checked})}></Checkbox>
                        <label className="p-checkbox-label">Angemeldet bleiben?</label>
                    </div>
                    <Button id="loginbtn" label="ANMELDEN" className="p-button-raised" onClick={this.handleClick} />
                </div>
            </div>
        );
    }
}
Login.contextType = RefContext;
export default withRouter(Login);