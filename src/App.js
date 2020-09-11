import React, { Component } from 'react';
import { Switch, Route,  withRouter } from 'react-router-dom';
import { RefContext } from "./component/helper/Context";
import { resizeEventLimiter } from "./component/helper/ResizeEventLimiter"
import { Toast } from 'primereact/toast';
import queryString from 'query-string'
import 'primereact/resources/themes/nova/theme.css'
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import "primeflex/primeflex.css";

import './App.css';
//import '@fortawesome/fontawesome-free/js/all.js';
//import '@fortawesome/fontawesome-free/css/all.css';
import 'font-awesome/css/font-awesome.min.css'

//Component Imports
import Login from './component/frontend/login/Login';
import Main from './component/frontend/main/Main';
import Menu from './component/frontend/menu/Menu';
import Footer from "./component/frontend/footer/Footer";
import Settings from './component/frontend/settings/Settings';

//Handling Imports
import ServerCommunicator from './handling/ServerCommunicator';
import UiBuilder from './handling/UiBuilder';
import ResponseHandler from './handling/ResponseHandler';
import ContentStore from "./handling/ContentStore";

class App extends Component {
    constructor(props){
        super(props);

        this.uiBuilder = new UiBuilder();
        this.responseHandler = new ResponseHandler();
        this.serverComm = new ServerCommunicator();
        this.contentStore = new ContentStore();

        this.responseHandler.setServerCommunicator(this.serverComm);
        this.responseHandler.setContentStore(this.contentStore);
        this.responseHandler.setMainScreen(this);

        this.serverComm.setResponseHandler(this.responseHandler);

        this.uiBuilder.setServerCommunicator(this.serverComm);

        const queryParams = queryString.parse(window.location.search);
        if(queryParams.baseUrl){
            this.serverComm.BaseUrl = queryParams.baseUrl
        }

        if(queryParams.appName) {
            this.serverComm.applicationName = queryParams.appName;
        } else {
            this.serverComm.applicationName ="demo"
        }

        this.routeTo("/");
        this.serverComm.startUp(queryParams.userName, queryParams.password);


        this.state={
            serverComm: this.serverComm,
            uiBuilder: this.uiBuilder,
            contentStore: this.contentStore,
            menuLocation: 'top',
            theme: "dark",
            changeMenuPositon: this.changeMenuPositon.bind(this),
            changeTheme: this.changeTheme.bind(this),
            toast: this.showToastMessage.bind(this)
        }
        this.routeTo = this.routeTo.bind(this);
    }

    

    showToastMessage(messageObj){
        this.toast.show(messageObj);
    }

    changeMenuPositon(){
        this.state.menuLocation === "top" ? this.setState({menuLocation: "side"}) : this.setState({menuLocation: "top"});
    }

    changeTheme(theme){
        this.setState({theme: theme});
    }

    routeTo(route){
        if(route !== this.props.location.pathname){
            this.props.history.push(route);
        }
    }

    refresh(){
        this.props.history.replace(this.props.location);
    }

    handleResize(){
        this.serverComm.deviceStatus(window.innerHeight, window.innerWidth);
    }

    componentDidMount() {
        window.addEventListener("resize", resizeEventLimiter(this.handleResize, 500, this).bind(this));
    }

    componentWillUnmount() {
        window.removeEventListener("resize", resizeEventLimiter(this.handleResize, 500, this).bind(this));
    }

    render() {
        return (
            <main className={this.state.theme}>
                <RefContext.Provider value={this.state}>
                    <Toast ref={(el) => this.toast = el} position="topright" />
                    <Route path="/main**" component={() => <Menu/>} />
                    <Switch>
                        <Route path="/login" exact={true} component={() => <Login />}  />
                        <Route path="/main/settings" component={() => <Settings/>} />
                        <Route path="/main/:compId" component={() => <Main />} />
                        <Route path="/main" component={() => <Main/>} />
                    </Switch>
                    <Route path="/main**" component={() => <Footer menuLocation={this.state.menuLocation}/>} />
                </RefContext.Provider>
            </main>
        );
    }
}
export default withRouter(App);