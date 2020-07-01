import React, { Component } from "react";
import "./Content.scss"
import FooterComponent from "./Footer"
import { stretch } from "./Stretch";
import BScreen from "./responseObj/BScreen"
import { withRouter, Redirect, Route, Switch } from "react-router-dom";

class ContentComponent extends BScreen {

    //state variables
    state = {
        menu: [],
        content: [],
        username: ""
    }

    /**
     * When the component gets mounted, start the stretch method onto the sidemenu, if sidemenu is selected. For more details visit stretch doc.
     * Content is set as superparent --SOON TO BE DELETED--
     */
    componentDidMount() {
        if(!this.props.menuTop) {
            stretch('content-sidemenu');
        }
    }

    /**
     * Sends the username which gets set here (because of superparent) to the "App" so it can be used when switching sites
     */
    sendUsername() {
        return this.state.username ? this.props.setUsername(this.state.username) : null
    }

    routeToScreen(navigateTo){
        this.props.history.push('/'+ navigateTo)
    }

    makeRoutes(ref){
        let routes = []
        ref.state.content.forEach(e => {
            routes.push(<Route key={e.props.componentid} path={"/" + e.props.componentid} component={() => e} />)
        });
        return routes;
    }

    //Renders the content of the page.
    render() {
        this.sendUsername();
        if(!this.props.loggedIn) {
            return <Redirect to='/login' />
        }
        if(this.props.menuTop) {
            return (
                <React.Fragment>
                    <div className="content-topmenu">
                        <div className="p-grid">
                            <Switch>
                                {this.makeRoutes(this)}
                            </Switch>
                            {this.state.route}
                        </div>
                        <FooterComponent menuTop={this.props.menuTop} divToCheck="content-topmenu"/>
                    </div>
                </React.Fragment>
            )
        }
        else {
            return (
                <React.Fragment>
                    <div className="content-sidemenu">
                        <div className="p-grid">
                            <Switch>
                                {this.makeRoutes(this)}
                            </Switch>
                            {this.state.route}
                        </div>
                        <FooterComponent menuTop={this.props.menuTop} divToCheck="content-sidemenu"/>
                    </div>
                </React.Fragment>
            )
        }
    }
}

export default withRouter(ContentComponent);