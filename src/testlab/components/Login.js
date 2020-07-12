import React, { Component } from 'react';
import { Button } from 'primereact/button';
import { RefContext } from './Context';
import { withRouter } from 'react-router-dom';

class Login extends Component {
    state = {  }


    render() { 
        return (
            <div>
                <Button label="Log in as features" onClick={() => this.context.serverComm.logIn("features","features")} />
            </div>
        );
    }
}
Login.contextType = RefContext;
export default withRouter(Login);