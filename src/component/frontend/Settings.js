import React, { Component } from "react";
import "./Settings.scss"
import {Card} from 'primereact/card';
import {InputSwitch} from 'primereact/inputswitch';
import { stretch } from "./Stretch";
import { withRouter } from "react-router-dom";
import {RadioButton} from 'primereact/radiobutton';
import AppContext from "./AppContext";

class SettingsComponent extends Component {
    //state variabls
    state = {
        menu: [],
        content: [],
        username: ""
    }

    /**
     * When the component gets mounted, start the stretch method onto the sidemenu, if sidemenu is selected. For more details visit stretch doc.
     */
    componentDidMount() {
        if(!this.context.state.menuTop && this.context.state.loggedIn) {
            stretch("settings-content-side")
        }
    }

    settingsBuilder(menuLocation) {
        return (
            <div className={"settings-content-" + menuLocation}>
                <div className="p-grid settings-grid">
                    <Card className="p-col-3" title="Menüeinstellung" subTitle="Hier kann eingestellt werden, ob das Menü links oder oben angezeigt werden soll.">
                        <span className="inputswitch-text">Menü oben</span>
                        <InputSwitch checked={this.context.state.menuTop} onChange={this.context.changeMenuValue} />
                    </Card>
                    <Card className="p-col-3" style={{ marginRight: '10px' }} title="Theme" subTitle="Hier kann eingestellt werden, welches Theme angezeigt werden soll.">
                        <RadioButton checked={this.context.state.theme === 'dark'} inputId="rb1" name="theme" value="dark" onChange={this.context.changeThemeValue} />
                        <label htmlFor="rb1" className="p-radiobutton-label">Dark</label>
                        <RadioButton checked={this.context.state.theme === 'light'} inputId="rb2" name="theme" value="light" onChange={this.context.changeThemeValue} />
                        <label htmlFor="rb2" className="p-radiobutton-label">Light</label>
                        <RadioButton checked={this.context.state.theme === 'blue'} inputId="rb3" name="theme" value="blue" onChange={this.context.changeThemeValue} />
                        <label htmlFor="rb3" className="p-radiobutton-label">Blue</label>
                    </Card>
                </div>
            </div>
        )
    }

    /**
     * Based on the selected menu the settings get rendered. The position of the menu can be changed with the Inputswitch if the switch is on the menu is at the top, if off on the side.
     * There are 3 selectable themes, dark, light and blue
     */
    render() {
        if(this.context.state.menuTop) {
            return (
                this.settingsBuilder('top')
            )
        }
        else {
            return (
                this.settingsBuilder('side')
            )
        }
    }
}
SettingsComponent.contextType = AppContext;
export default withRouter(SettingsComponent)