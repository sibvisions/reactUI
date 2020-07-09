import React, { Component } from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import 'primereact/resources/themes/nova-light/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import "primeflex/primeflex.css";

//Component Imports
import Login from './Login';
import Main from './Main';
import { RefContext } from "./Context";

//Handling Imports
import ServerCommunicator from '../../handling/ServerCommunicator';
import UiBuilder from '../../handling/UiBuilder';
import ResponseHandler from '../../handling/ResponseHandler';



class App extends Component {

    constructor(props){
        super(props);

        this.uiBuilder = new UiBuilder(this);
        this.responseHandler = new ResponseHandler(this.uiBuilder);
        this.serverComm = new ServerCommunicator(this.responseHandler);

        this.uiBuilder.setBtnPressClass(this.serverComm)


        this.serverComm.startUp();
        console.log("App Constructor")

        this.providerValue = {
            uiBuilder: this.uiBuilder,
            responseHandler: this.responseHandler,
            serverComm: this.serverComm
        };
    }

    render() { 
        return ( 
            <RefContext.Provider value={this.providerValue}>
                <Switch>
                    <Route path="/login" component={() => <Login />}  />
                    <Route path="/main" component={() => <Main />} />
                    <Redirect from="*" to="/login" />
                </Switch>
            </RefContext.Provider>
        );
    }
}
 
export default App;