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
        this.menuSub = this.context.uiBuilder.menuSubject.subscribe(m => this.gotMenuItems(m));
    }

    componentWillUnmount(){
        this.menuSub.unsubscribe();
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