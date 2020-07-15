import React, { Component } from "react";
import "./Settings.scss"
import {Card} from 'primereact/card';
import {InputSwitch} from 'primereact/inputswitch';
import { stretch } from "./Stretch";
import { withRouter } from "react-router-dom";
import {RadioButton} from 'primereact/radiobutton';
import { RefContext } from "../helper/Context";

import "./Settings.scss";

class SettingsComponent extends Component {

    /**
     * When the component gets mounted, start the stretch method onto the sidemenu, if sidemenu is selected. For more details visit stretch doc.
     */
    componentDidMount() {
        if(this.context.menuLocation === "side")
            stretch("settings-content-side")
        }
    /**
     * Based on the selected menu the settings get rendered. The position of the menu can be changed with the Inputswitch if the switch is on the menu is at the top, if off on the side.
     * There are 3 selectable themes, dark, light and blue
     */
    render() {
        return(
        <RefContext.Consumer>
        {value => 
        <div className={"settings-content-" + value.menuLocation}>
            <div className="p-grid settings-grid">
                <Card className="p-col-3" title="Menüeinstellung" subTitle="Hier kann eingestellt werden, ob das Menü links oder oben angezeigt werden soll.">
                    <span className="inputswitch-text">Menü oben</span>
                    <InputSwitch checked={value.menuLocation==="top"} onChange={() => value.changeMenuPositon()} />
                </Card>
                <Card className="p-col-3" style={{ marginRight: '10px' }} title="Theme" subTitle="Hier kann eingestellt werden, welches Theme angezeigt werden soll.">
                    <RadioButton checked={value.theme === 'dark'} inputId="rb1" name="theme" value="dark" onChange={() => value.changeTheme("dark")} />
                    <label htmlFor="rb1" className="p-radiobutton-label">Dark</label>
                    <RadioButton checked={value.theme === 'light'} inputId="rb2" name="theme" value="light" onChange={() => value.changeTheme("light")} />
                    <label htmlFor="rb2" className="p-radiobutton-label">Light</label>
                    <RadioButton checked={value.theme === 'blue'} inputId="rb3" name="theme" value="blue" onChange={() => value.changeTheme("blue")} />
                    <label htmlFor="rb3" className="p-radiobutton-label">Blue</label>
                </Card>
            </div>
        </div>}
        </RefContext.Consumer>
        )
    }
}
export default withRouter(SettingsComponent)