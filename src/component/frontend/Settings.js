import React, { Component } from "react";
import "./Settings.scss"
import {Card} from 'primereact/card';
import {InputSwitch} from 'primereact/inputswitch';
import { stretch } from "./Stretch";
import { withRouter } from "react-router-dom";
import {RadioButton} from 'primereact/radiobutton';

class SettingsComponent extends Component {
    //state variabls
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
        if(!this.props.menuTop && this.props.loggedIn) {
            stretch("settings-content-side")
        }
    }

    /**
     * Based on the selected menu the settings get rendered. The position of the menu can be changed with the Inputswitch if the switch is on the menu is at the top, if off on the side.
     * There are 3 selectable themes, dark, light and blue
     */
    render() {
        // if(!this.props.loggedIn) {
        // return <Redirect to='/login' />
        // } 
        if(this.props.menuTop) {
            return (
                <div className="settings-content-top">
                    <div className="p-grid">
                        <Card className="p-col-3" style={{marginRight: '10px'}} title="Menüeinstellung" subTitle="Hier kann eingestellt werden, ob das Menü links oder oben angezeigt werden soll.">
                            Menü oben
                            <InputSwitch checked={this.props.menuTop} onChange={this.props.changeMenuValue} />
                        </Card>
                        <Card className="p-col-3" style={{marginRight: '10px'}} title="Theme" subTitle="Hier kann eingestellt werden, welches Theme angezeigt werden soll.">
                            <RadioButton checked={this.props.theme === 'dark'} inputId="rb1" name="theme" value="dark" onChange={this.props.changeThemeValue}/>
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
                <div className={"settings-content-side"}>
                    <div className="p-grid">
                        <Card className="menucard p-col-3" title="Menüeinstellung" subTitle="Hier kann eingestellt werden, ob das Menü links oder oben angezeigt werden soll.">
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
    }
}

export default withRouter(SettingsComponent)