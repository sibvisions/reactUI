import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
//import App from './App';
import App from "./testlab/components/App";
import * as serviceWorker from './serviceWorker';
import { BrowserRouter } from 'react-router-dom';

import { sendRequest } from "./handling/Tower";

ReactDOM.render(
  <BrowserRouter basename={'/reactui'}>
    <App />
  </BrowserRouter>,
  document.getElementById('root')
);
serviceWorker.unregister();
