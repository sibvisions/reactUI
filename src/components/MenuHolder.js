import React, { Component } from 'react';
import TopMenuComponent from "./TopMenu";
import MenuComponent from "./Menu";
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
            this.props.menuTop ? <TopMenuComponent menu={this.state.items} theme={this.props.theme} profileMenu={this.props.profileMenu}/>
            : 
            <MenuComponent menu={this.state.items} theme={this.props.theme} profileMenu={this.props.profileMenu} />
        );
    }
}
 
export default MenuHolder;