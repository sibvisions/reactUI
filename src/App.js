import React from 'react';
import 'primereact/resources/themes/nova-light/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import "primeflex/primeflex.css";
import "./App.css"
import LoginComponent from "./Components/Login.js"
import {Route, Switch } from 'react-router-dom';
import MenuComponent from './Components/Menu';

function App() {
  return (
    <main>
      <Switch>
        <Route path="/login" component={LoginComponent} />
        <Route path="/" component={MenuComponent} />
      </Switch>
    </main>
  )
  
}
  

export default App;
