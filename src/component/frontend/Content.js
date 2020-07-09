import React, { Component } from "react";
import "./Content.scss"
import FooterComponent from "./Footer"
import { stretch } from "./Stretch";
import BScreen from "../responseObj/BScreen"
import { withRouter, Redirect, Route, Switch } from "react-router-dom";
import AppContext from "./AppContext";
import BorderLayout from "../../layouts/BorderLayout";

class ContentComponent extends BScreen {

    state = {
        menu: [],
        content: [],
        username: ""
    }

    componentDidMount() {
        console.log('mounted')
    }

    componentWillUnmount() {
        console.log('unmounted')
    }

    /**
     * When the component gets mounted, start the stretch method onto the sidemenu, if sidemenu is selected. For more details visit stretch doc.
     */
    componentDidUpdate() {
        this.sendUsername();
        if(!this.context.state.menuTop && this.props.location.pathname !== '/settings' && this.context.state.loggedIn) {
            stretch('content-sidemenu');
        }
    }

    /**
     * Sends the username which gets set here (because of superparent) to the "App" so it can be used when switching sites
     */
    sendUsername() {
        return this.state.username ? this.context.setUsername(this.state.username) : null
    }

    contentBuilder(menuLocation) {
        return (
            <React.Fragment>
                <div className={"content-" + menuLocation + "menu"}>
                    <div className="p-grid parent-grid">
                        <Switch>
                            {this.makeRoutes(this)}
                        </Switch>
                        {this.state.route}
                    </div>
                </div>
                <FooterComponent menuTop={this.context.state.menuTop} /*divToCheck={"content-" + menuLocation + "menu"}*/ />
            </React.Fragment>
        )
    }

    routeToScreen(navigateTo){
        this.props.history.push('/'+ navigateTo)
    }

    makeRoutes(ref){
        let routes = []
        ref.state.content.forEach(e => {
            routes.push(<Route key={e.props.componentid} path={"/" + e.props.componentid} component={() => <BorderLayout center={e} />} />)
        });
        return routes;
    }

    //Renders the content of the page.
    render() {
        if (!this.context.state.loggedIn) {
            return <Redirect to='/login' />
        }
        if(this.props.location.pathname === '/settings') {
            if(this.context.state.menuTop) {
                return <FooterComponent menuTop={this.context.state.menuTop} /*divToCheck={"settings-content-side"}*/ />
            }
            else {
                return <FooterComponent menuTop={this.context.state.menuTop} /*divToCheck={"settings-content-side"}*/ />
            }
        }
        else if (this.context.state.menuTop) {
            return this.contentBuilder('top')
        }
        else {
            return this.contentBuilder('side')
        }
    }
}
ContentComponent.contextType = AppContext
export default withRouter(ContentComponent);