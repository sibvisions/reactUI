import React, { Component } from "react";
import "./Content.scss"
import FooterComponent from "./Footer"
import { stretch } from "./Stretch";
import { setSuperParent } from "../handling/TowerV2";
import { withRouter } from "react-router-dom";

class ContentComponent extends Component {

    state = {
        menu: [],
        content: [],
        username: ""
    }

    componentDidMount() {
        if(!this.props.menuTop) {
            stretch('content-sidemenu');
        }
        setSuperParent(this);
    }

    sendUsername() {
        return this.state.username ? this.props.setUsername(this.state.username) : null
    }

    render() {
        this.sendUsername();
        if(this.props.menuTop) {
            return (
                <React.Fragment>
                    <div className="content-topmenu">
                        <div className="p-grid">
                           {this.state.content}
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
                            {this.state.content}
                        </div>
                        <FooterComponent menuTop={this.props.menuTop} divToCheck="content-sidemenu"/>
                    </div>
                </React.Fragment>
            )
        }
    }
}

export default withRouter(ContentComponent);