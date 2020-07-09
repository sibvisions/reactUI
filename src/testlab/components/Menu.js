import React, { Component } from 'react';
import {Menubar} from 'primereact/menubar';
import { RefContext } from './Context';



class Menu extends Component {
    constructor(props) {
        super(props);
        this.state = {  }

        this.gotMenuItems = this.gotMenuItems.bind(this)
    }

    menuItems = []

    componentDidMount(){
        this.context.uiBuilder.subscribeToMenu(this.gotMenuItems);
    }

    componentWillUnmount(){
        this.context.uiBuilder.unsubscribeFromMenu(this.gotMenuItems);
    }

    gotMenuItems(menuItems){
        this.setState({menu: menuItems});
    }

    pressButton(componentId){
        let body = {
            clientId: localStorage.getItem("clientId"),
            componentId: componentId
        }; this.sendRequest("/api/v2/pressButton", body);
    }

    render() { 
        return ( 
            <Menubar model={this.state.menu ? this.state.menu : []} />
        );
    }
}
Menu.contextType=RefContext;
export default Menu;