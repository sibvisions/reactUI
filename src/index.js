import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
//import App from "./testlab/components/App";
import * as serviceWorker from './serviceWorker';
import { BrowserRouter } from 'react-router-dom';
import FlowLayout from './layouts/FlowLayout';
import GridLayout from './layouts/GridLayout';
import NullLayout from './layouts/NullLayout';

ReactDOM.render(
  <BrowserRouter basename={'/reactui'}>
    <App />
  </BrowserRouter>,
  document.getElementById('root')
);
serviceWorker.unregister();
