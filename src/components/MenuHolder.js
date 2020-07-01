import React, { Component } from 'react';
import TopMenuComponent from "./TopMenu";
import { registerMenuChange, handler } from '../handling/TowerV4';

class MenuHolder extends Component {

    state= {content : [], items: []}

    constructor(props){
        super(props);
        this.reloadMenu = this.reloadMenu.bind(this)

        
    }

    reloadMenu(newMenuItems){
        this.setState({items: newMenuItems})
    }

    componentDidMount() {
        registerMenuChange(this.reloadMenu)
    }
    
    render() {
        return (  
            <TopMenuComponent menu={this.state.items}/> 
        );
    }
}
 
export default MenuHolder;