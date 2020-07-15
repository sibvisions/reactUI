import React, { Component } from 'react';
import {Menubar} from 'primereact/menubar';
import { RefContext } from './Context';
import { Link, withRouter } from 'react-router-dom';

class Menu extends Component {

    


    render() { 
        return (
            <RefContext.Consumer>
            {value => 
                <Menubar model={value.contentSafe.menuItems}>
                    <Link to="/main/settings" >Link to Settings</Link>
                </Menubar>
            }
            </RefContext.Consumer>
        );
    }
}
export default withRouter(Menu);