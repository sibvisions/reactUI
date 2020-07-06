import React, { Component } from 'react';
import 'primereact/resources/themes/nova-light/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import "primeflex/primeflex.css";
import {Growl} from 'primereact/growl';
import "./App.css"
import LoginComponent from "./component/frontend/Login.js"
import {Route, Switch} from 'react-router-dom';
import ContentComponent from './component/frontend/Content'
import SettingsComponent from './component/frontend/Settings';
import { withRouter } from "react-router-dom";
import MenuHolder from "./component/frontend/MenuHolder";

import { logOut } from "./handling/Tower";
import { AppProvider } from './component/frontend/AppContext';

class App extends Component {

  /**
   * constructor with state variables and method bindings
   * @param {*} props default for constructor
   */
  constructor(props) {
    super(props);
    
    this.state = {
      menuTop: true,
      theme: 'dark',
      loggedIn: false,
      settingsActive: false,
      username: ''
    }
    this.changeMenuValue = this.changeMenuValue.bind(this);
    this.changeThemeValue = this.changeThemeValue.bind(this);
    this.setUsername = this.setUsername.bind(this);
    this.setLoggedIn = this.setLoggedIn.bind(this);
    this.settingsFlip = this.settingsFlip.bind(this);
  }

  /**
   * If the Inputswitch value in Settings component gets changed this function gets called and the state will be set.
   */
  changeMenuValue() {
    this.state.menuTop ? this.setState({menuTop: false}) : this.setState({menuTop: true});
  }

  /**
   * If the Theme Radiobutton value in Settings component gets changed this function gets called and the state will be set.
   */
  changeThemeValue(input) {
    this.setState({theme: input.value});
  }

  /**
   * If the user logs in, this methodgets called to set the state.
   */
  setLoggedIn() {
    this.setState({loggedIn: true});
    this.props.history.replace('/');
  }

  settingsFlip() {
    this.setState({settingsActive: !this.state.settingsActive});
  }

  /**
   * Profileoptions are set here with the username of the user. These get sent to the components whichneed to show the users profile
   */
  sendProfileOptions = () => {
    if(this.state !== undefined && this.state.username !== "") {
      return [
        {
          label: this.state.username,
          icon: "pi avatar-icon",
          items: [
              {
                label: 'Home',
                icon: "pi pi-home",
                command: () => {
                  this.props.history.push('/');
                }
              },
              {
                  label: 'Profil',
                  icon: "pi pi-user"
              },
              {
                  label: 'Einstellungen',
                  icon: "pi pi-cog",
                  command: () => {
                    this.props.history.push('/settings');
                    this.settingsFlip();
                  }
              },
              {
                  label: 'Logout',
                  icon: "pi pi-power-off",
                  command: () => {
                    logOut();
                    this.setState({loggedIn: false});
                    this.props.history.push('/login');
                    this.growl.show({severity: 'info', summary: 'Logged out successfully', detail: 'You\'ve been logged out'});
                  }

              }
          ]
        },
      ]
    }
  }

  /**
   * Because the superparent is set in content the username gets set in the Content. This function gets called when the username is set in Content and sets the state in App so it can be used later on.
   * @param {string} input the username which is sent by the Content component.
   */
  setUsername(input) {
    if(this.state.username === '') {
      this.setState({username: input})  
    }
  }

  

  /**
   * theme gets set, if the user is not logged in the menu will not be rendered. Basic routing for different components and functions are set as props.
   */
  render() {
    return (
      <AppProvider
        value={{
          state: this.state,
          sendProfileOptions: this.sendProfileOptions,
          setLoggedIn: this.setLoggedIn,
          changeMenuValue: this.changeMenuValue,
          changeThemeValue: this.changeThemeValue,
          setUsername: this.setUsername
          }}>
        <main className={this.state.theme}>
          {/* <button onClick={() => lazyLogin()}>log in lazy</button> <button onClick={() => logOut()}>log out</button> */}
          <Growl ref={(el) => this.growl = el} position="topright" />
          {this.state.loggedIn ? <MenuHolder/> : null}
          {/* <Switch>
            <Route path="/login" component={() => <LoginComponent loggedIn={this.state.loggedIn} setLoggedIn={this.setLoggedIn}/>}/>
            <Route path="/content" component={() => <ContentComponent loggedIn={this.state.loggedIn} menuTop={this.state.menuTop} theme={this.state.theme} setUsername={this.setUsername}/>}/>
            <Route path="/settings" component={() => <SettingsComponent loggedIn={this.state.loggedIn} menuTop={this.state.menuTop} theme={this.state.theme} changeMenuValue={this.changeMenuValue} changeThemeValue={this.changeThemeValue} />} />
            <Redirect exact from="/" to="login" />
          </Switch> */}
          <Switch>
            <Route path="/login" component={() => <LoginComponent/>}/>
            <Route path="/settings" component={() => <SettingsComponent/>} />
          </Switch>
          <ContentComponent/>
        </main>
      </AppProvider>
    )
  }
}

export default withRouter(App);
