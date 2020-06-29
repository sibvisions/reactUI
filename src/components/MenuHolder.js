import React, { Component } from 'react';
import TopMenuComponent from "./TopMenu";
import MenuComponent from "./Menu";
import { registerToMenuChanges, unregisterFromMenuChanges } from '../handling/TowerV2';

class MenuHolder extends Component {
    //state variables
    state = { 
        show: true,
        items: []
    }

    /**
     * Constructor for binding
     * @param {*} props default for constructor
     */
    constructor(props){
        super(props);

        this.reloadMenu = this.reloadMenu.bind(this)
    }

    /**
     * Sets new items to the State triggering re-render
     * @param {*} newMenuItems new items that get added to the menu
     */
    reloadMenu(newMenuItems){
        this.setState({items: newMenuItems})
    }

    /**
     * When the menuholder component mounts, it gets registered to the tower and when there is a menuchange, the menu gets overwritten
     */
    componentDidMount() {
        registerToMenuChanges(this.reloadMenu)
    }

    /**
     * When the menuholder component unmounts, it gets released from the tower
     */
    componentWillUnmount(){
        unregisterFromMenuChanges(this.reloadMenu)
    }

    /**
     * Based on whether the men is on top or on the side, the respective menu component gets rendered
     */
    render() {
        return (
            this.props.menuTop ? <TopMenuComponent menu={this.state.items} theme={this.props.theme} profileMenu={this.props.profileMenu}/>
            : 
            <MenuComponent menu={this.state.items} theme={this.props.theme} profileMenu={this.props.profileMenu} />
        );
    }
}
 
export default MenuHolder;