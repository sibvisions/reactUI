import React, { Component } from 'react';
import 'primereact/resources/themes/nova-light/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import "primeflex/primeflex.css";

import "./App.css"
import LoginComponent from "./Components/Login.js"
import {Route, Switch} from 'react-router-dom';
import ContentComponent from './Components/Content.js'
import SettingsComponent from './Components/Settings';

import { sender, setSuperParent } from "./handling/TowerV2";

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      menuTop: true,
      menu: [],
      content: []
    }
    this.changeMenuValue = this.changeMenuValue.bind(this);
  }

  componentDidMount() {
    setSuperParent(this);
    let info = {
        "layoutMode" : "generic",
        "appMode" : "full",
        "applicationName" : "demo"
      }; sender("/api/startup", info, this);
  }

  changeMenuValue() {
    this.state.menuTop ? this.setState({menuTop: false}) : this.setState({menuTop: true});
    }

  render() {
    return (
      <main>
        <Switch>
          <Route path="/login" component={LoginComponent} />
          <Route path="/content" component={() => <ContentComponent content={this.state.content} menu={this.state.menu} menuTop={this.state.menuTop}/>} />
          <Route path="/settings" component={() => <SettingsComponent menuTop={this.state.menuTop} changeMenuValue={this.changeMenuValue} />} />
        </Switch>
      </main>
    )
  }
}
  

export default App;
