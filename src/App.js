import React, { Component } from 'react';
import 'primereact/resources/themes/nova-light/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import "primeflex/primeflex.css";

import "./App.css"
import LoginComponent from "./components/Login.js"
import {Route, Switch,Redirect} from 'react-router-dom';
import ContentComponent from './components/Content'
import SettingsComponent from './components/Settings';
import { withRouter } from "react-router-dom";
import { lazyLogin, logOut } from "./handling/TowerV2";
import MenuHolder from "./components/MenuHolder";


class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      menuTop: true,
      theme: 'dark',
      username: ''
    }
    this.changeMenuValue = this.changeMenuValue.bind(this);
    this.changeThemeValue = this.changeThemeValue.bind(this);
    this.setUsername = this.setUsername.bind(this);
  }

  changeMenuValue() {
    this.state.menuTop ? this.setState({menuTop: false}) : this.setState({menuTop: true});
  }

  changeThemeValue(input) {
    this.setState({theme: input.value});
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

  setUsername(input) {
    this.setState({username: input})
  }

  render() {
    return (
      <main className={this.state.theme}>
        <button onClick={() => lazyLogin()}>log in lazy</button> <button onClick={() => logOut()}>log out</button>
        <MenuHolder menuTop={this.state.menuTop} theme={this.state.theme} profileMenu={this.sendProfileOptions()}/>
        <Switch>
          <Route path="/login" component={LoginComponent} />
          <Route path="/content" component={() => <ContentComponent menuTop={this.state.menuTop} theme={this.state.theme} setUsername={this.setUsername}/>}/>
          <Route path="/settings" component={() => <SettingsComponent menuTop={this.state.menuTop} theme={this.state.theme} changeMenuValue={this.changeMenuValue} changeThemeValue={this.changeThemeValue} />} />
          <Redirect exact from="/" to="login" />
        </Switch>
      </main>
    )
  }
}
  

export default withRouter(App);
