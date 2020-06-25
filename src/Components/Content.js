import React, { Component } from "react";
import "./Content.css"
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

    sendProfileOptions() {
        let profileOptions = [
            {
                label: this.state.username,
                icon: "pi avatar-icon",
                items: [
                    {
                        label: 'Profil',
                        icon: "pi pi-user"
                    },
                    {
                        label: 'Einstellungen',
                        icon: "pi pi-cog",
                        command: () => this.props.history.push('/settings')
                    },
                    {
                        label: 'Logout',
                        icon: "pi pi-power-off"
                    }
                ]
            },
        ]

        return profileOptions
    }

    componentDidMount() {
        if(!this.props.menuTop) {
            stretch('content-sidemenu');
        }
        setSuperParent(this);
    }

    render() {
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