import React, { Component } from 'react';
import { Switch, Route, Redirect, withRouter } from 'react-router-dom';
import 'primereact/resources/themes/nova-light/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import "primeflex/primeflex.css";
import {Growl} from 'primereact/growl';

//Component Imports
import Login from './component/frontend/Login';
import Main from './component/frontend/Main';
import { RefContext } from "./component/helper/Context";
import ContentSafe from "./handling/ContentSafe";

//Handling Imports
import ServerCommunicator from './handling/ServerCommunicator';
import UiBuilder from './handling/UiBuilder';
import ResponseHandler from './handling/ResponseHandler';
import Menu from './component/frontend/Menu';
import Settings from './component/frontend/Settings';



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
        this.state={
            serverComm: this.serverComm,
            uiBuilder: this.uiBuilder,
            contentSafe: this.contentSafe,
            menuLocation: 'side',
            theme: "dark",
            changeMenuPositon: this.changeMenuPositon.bind(this),
            changeTheme: this.changeTheme.bind(this)
        }
    }

    changeMenuPositon(){
        this.state.menuLocation === "top" ? this.setState({menuLocation: "side"}) : this.setState({menuLocation: "top"})
    }

    changeTheme(theme){
        console.log(this)
        this.setState({theme: theme})
    }

    routeTo(route){
        this.props.history.push(route)
    }

    render() { 
        return ( 
            <span className={this.state.theme}>
                <RefContext.Provider value={this.state}>
                    <Growl ref={(el) => this.growl = el} position="topright" />
                    <Route path="/main**" component={() => <Menu/>} />
                    <Switch>
                        <Route path="/login" exact={true} component={() => <Login />}  />
                        <Route path="/main/settings" component={() => <Settings/>} />
                        <Route path="/main/:compId" component={() => <Main />} />
                        <Route path="/main" component={() => <Main/>} />
                        <Redirect from="*" to="/login" />
                    </Switch>
                </RefContext.Provider>
            </span>
        );
    }
}
export default withRouter(App);