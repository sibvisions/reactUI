import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
//import App from "./testlab/components/App";
import * as serviceWorker from './serviceWorker';
import { BrowserRouter } from 'react-router-dom';
import FlowLayout from './layouts/FlowLayout';
import GridLayout from './layouts/GridLayout';

ReactDOM.render(
  <BrowserRouter basename={'/reactui'}>
    <GridLayout />
  </BrowserRouter>,
  document.getElementById('root')
);
serviceWorker.unregister();
