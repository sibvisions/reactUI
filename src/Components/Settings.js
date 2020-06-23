import React, { Component } from "react";
import "./Settings.css"
import TopMenuComponent from "./TopMenu";
import MenuComponent from "./Menu";
import {Card} from 'primereact/card';
import {InputSwitch} from 'primereact/inputswitch';
import { stretch } from "./Stretch";
import FooterComponent from "./Footer"

class SettingsComponent extends Component {

    componentDidMount() {
        if(!this.props.menuTop) {
            stretch("settings-content-side")
        }
    }
    render() {
        if(this.props.menuTop) {
            return (
                <div className="layout-container">
                    <TopMenuComponent />
                    <div className="settings-content-top p-grid">
                        <Card className="p-col-3" title="Menüeinstellung" subTitle="Hier kann eingestellt werden, ob das Menü links oder oben angezeigt werden soll.">
                            Menü oben
                            <InputSwitch checked={this.props.menuTop} onChange={this.props.changeMenuValue} />
                        </Card>
                        <FooterComponent menuTop={this.props.menuTop} divToCheck="settings-content-top"/>
                    </div>
                </div>
            )
        }
        else {
            return (
                <div className="layout-container">
                    <MenuComponent />
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

export default SettingsComponent