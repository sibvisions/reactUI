import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { BrowserRouter } from 'react-router-dom';

import { sendRequest } from "./handling/Tower";

function start(){
    let info = {
      "layoutMode" : "generic",
      "appMode" : "full",
      "applicationName" : "demo"
    }; sendRequest("/api/startup", info, this);
}

ReactDOM.render(
  <BrowserRouter basename={'/reactui'}>
  {start()}
    <App />
  </BrowserRouter>,
  document.getElementById('root')
);
serviceWorker.unregister();
