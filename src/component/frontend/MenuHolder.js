import React, { Component } from 'react';
import {AppContext} from '../../App'
import TopMenuComponent from "./TopMenu";
import { registerMenuChange } from '../../handling/Tower';
import MenuComponent from "./Menu"

class MenuHolder extends Component {

    state= {content : [], items: []}

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
        registerMenuChange(this.reloadMenu)
    }
    
    render() {
        return (
            <AppContext.Consumer>
                {({state}) => (
                    state.menuTop ? <TopMenuComponent menu={this.state.items}/>
                    : 
                    <MenuComponent menu={this.state.items} />
                )}
            
            </AppContext.Consumer>
            
        );
    }
}
 
export default MenuHolder;