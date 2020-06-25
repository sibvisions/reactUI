import React, { Component } from 'react';
import 'primereact/resources/themes/nova-light/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import "primeflex/primeflex.css";

import "./App.css"
// import LoginComponent from "./components/Login.js"
// import {Route, Switch,Redirect} from 'react-router-dom';
// import ContentComponent from './components/Content'
// import SettingsComponent from './components/Settings';
import MenuHolder from "./components/MenuHolder";

import { lazyLogin, logOut } from "./handling/TowerV3";
import Test from "./components/Test";

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      menuTop: true
    }
    this.changeMenuValue = this.changeMenuValue.bind(this);
  }

  changeMenuValue() {
    this.state.menuTop ? this.setState({menuTop: false}) : this.setState({menuTop: true});
  }

  menuChanged(){
    
  }

  render() {
    return (
      <main>
        <button onClick={() => lazyLogin()}>log in lazy</button> <button onClick={() => logOut()}>log out</button>
        <MenuHolder />
        <Test />
        {/* <MenuHolder />
        <Switch>
          <Route path="/login" component={LoginComponent} />
          <Route path="/content" component={() => <ContentComponent menuTop={this.state.menuTop}/>} menuChanged={this.menuChanged} />
          <Route path="/settings" component={() => <SettingsComponent menuTop={this.state.menuTop} changeMenuValue={this.changeMenuValue} />} />
          <Redirect exact from="/" to="login" />
        </Switch> */}
      </main>
    )
  }
}
  

export default App;
