import React, { Component } from 'react';
import {Menubar} from 'primereact/menubar';
import { RefContext } from './Context';



class Menu extends Component {
    constructor(props) {
        super(props);
        this.state = {  }

        this.gotMenuItems = this.gotMenuItems.bind(this)
    }

    componentDidMount(){
        this.menuSub = this.context.uiBuilder.menuSubject.subscribe(m => this.gotMenuItems(m));
    }

    componentWillUnmount(){
        this.menuSub.unsubscribe();
    }

    gotMenuItems(menuItems){
        this.setState({menu: menuItems});
    }

    render() { 
        return (
            <Menubar model={this.state.menu ? this.state.menu : this.props.model} />
        );
    }
}
Menu.contextType=RefContext;
export default Menu;