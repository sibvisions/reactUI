import React, { Component } from 'react';
import { Switch, Route, Redirect, withRouter } from 'react-router-dom';
import 'primereact/resources/themes/nova-light/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import "primeflex/primeflex.css";

//Component Imports
import Login from './Login';
import Main from './Main';
import { RefContext } from "./Context";
import ContentSafe from "../ContentSafe";

//Handling Imports
import ServerCommunicator from '../ServerCommunicator';
import UiBuilder from '../UiBuilder';
import ResponseHandler from '../ResponseHandler';
import Menu from './Menu';
import Settings from './Settings';



class App extends Component {

    constructor(props){
        super(props);

        this.uiBuilder = new UiBuilder();
        this.responseHandler = new ResponseHandler();
        this.serverComm = new ServerCommunicator();
        this.contentSafe = new ContentSafe();

        this.responseHandler.setServerCommunicator(this.serverComm);
        this.responseHandler.setContentSafe(this.contentSafe);
        this.responseHandler.setMainScreen(this);

        this.serverComm.setResponseHandler(this.responseHandler);
        
        this.uiBuilder.setServerCommunicator(this.serverComm);

        this.serverComm.startUp();

        this.routeTo("/login");
        this.providerValue = {
            serverComm: this.serverComm,
            uiBuilder: this.uiBuilder,
            contentSafe: this.contentSafe,
            menuTop: true
        };
    }

    routeTo(route){
        this.props.history.push(route)
    }

    render() { 
        return ( 
            <RefContext.Provider value={this.providerValue}>
                <Route path="/main**" component={() => <Menu/>} />
                <Switch>
                    <Route path="/login" exact={true} component={() => <Login />}  />
                    <Route path="/main/settings" component={() => <Settings/>} />
                    <Route path="/main/:compId" component={() => <Main />} />
                    <Route path="/main" component={() => <Main/>} />
                    <Redirect from="*" to="/login" />
                </Switch>
            </RefContext.Provider>
        );
    }
}
 
export default withRouter(App);