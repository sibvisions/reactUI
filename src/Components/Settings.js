import React, { Component } from "react";
import "./Settings.scss"
import {Card} from 'primereact/card';
import {InputSwitch} from 'primereact/inputswitch';
import { stretch } from "./Stretch";
import FooterComponent from "./Footer"
import { withRouter } from "react-router-dom";
import { setSuperParent } from "../handling/TowerV2";
import {RadioButton} from 'primereact/radiobutton';

class SettingsComponent extends Component {
    state = {
        menu: [],
        content: [],
        username: ""
    }

    componentDidMount() {
        if(!this.props.menuTop) {
            stretch("settings-content-side")
        }
        console.log("setting mounted")
        setSuperParent(this)
    }
    render() {
        if(this.props.menuTop) {
            return (
                <div className="layout-container">
                    <div className="settings-content-top p-grid">
                        <Card className="p-col-3" title="Menüeinstellung" subTitle="Hier kann eingestellt werden, ob das Menü links oder oben angezeigt werden soll.">
                            Menü oben
                            <InputSwitch checked={this.props.menuTop} onChange={this.props.changeMenuValue} />
                        </Card>
                        <Card className="p-col-3" title="Theme" subTitle="Hier kann eingestellt werden, welches Theme angezeigt werden soll.">
                            <RadioButton checked={this.props.theme === 'dark'} inputId="rb1" name="theme" value="dark" onChange={this.props.changeThemeValue}  />
                            <label htmlFor="rb1" className="p-radiobutton-label">Dark</label>
                            <RadioButton checked={this.props.theme === 'light'} inputId="rb2" name="theme" value="light" onChange={this.props.changeThemeValue}  />
                            <label htmlFor="rb2" className="p-radiobutton-label">Light</label>
                            <RadioButton checked={this.props.theme === 'blue'} inputId="rb3" name="theme" value="blue" onChange={this.props.changeThemeValue}  />
                            <label htmlFor="rb3" className="p-radiobutton-label">Blue</label>
                        </Card>
                    </div>
                </div>
            )
        }
        else {
            return (
                <div className="layout-container">
                    <div className="settings-content-side p-grid">
                        <Card className="menucard p-col-3" title="Menüeinstellung" subTitle="Hier kann eingestellt werden, ob das Menü links oder oben angezeigt werden soll.">
                            Menü oben
                            <InputSwitch checked={this.props.menuTop} onChange={this.props.changeMenuValue} />
                        </Card>
                        <FooterComponent menuTop={this.props.menuTop} divToCheck="settings-content-side"/>
                    </div>
                    
                </div>
            )
        }
    }
}

export default withRouter(SettingsComponent)