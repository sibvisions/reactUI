import React, { Component } from 'react';
import TopMenuComponent from "./TopMenu";
import { registerToMenuChanges, unregisterFromMenuChanges } from '../handling/TowerV2';

class MenuHolder extends Component {
    state = { 
        show: true,
        items: []
    }

    constructor(props){
        super(props);

        this.reloadMenu = this.reloadMenu.bind(this)
    }

    reloadMenu(newMenuItems){
        this.setState({items: newMenuItems})
    }

    componentDidMount() {
        registerToMenuChanges(this.reloadMenu)
    }

    componentWillUnmount(){
        unregisterFromMenuChanges(this.reloadMenu)
    }

    render() {
        return (  
            <TopMenuComponent menu={this.state.items}/> 
        );
    }
}
 
export default MenuHolder;