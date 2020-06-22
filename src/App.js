import React, { Component } from 'react';
import {sender, setSuperParent} from './handling/TowerV2';


//prime
import 'primereact/resources/themes/nova-light/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import "primeflex/primeflex.css";

class App extends Component {
    state = { content: [] }

    componentDidMount() {
        setSuperParent(this);
        let info = {
            "layoutMode" : "generic",
            "appMode" : "full",
            "applicationName" : "demo"
          }; sender("/api/startup", info, this);
    }
    
    render() { 
        return ( 
        <div className="p-grid">
            <div className="p-col-8">{this.state.content}</div>
            <div className="p-col-4">{this.state.menu}</div>
        </div> );
    }
}
 
export default App;