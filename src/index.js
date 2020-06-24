import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { BrowserRouter } from 'react-router-dom';

import { sender } from "./handling/TowerV2";

function startup(){
  let info = {
    "layoutMode" : "generic",
    "appMode" : "full",
    "applicationName" : "demo"
}; sender("/api/startup", info, this);
}

ReactDOM.render(
  <BrowserRouter>
  {startup()}
    <App />
  </BrowserRouter>,
  document.getElementById('root')
);
serviceWorker.unregister();
