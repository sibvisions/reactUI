import React from 'react';
import { Component } from 'react';
import { registerScreen } from '../../handling/TowerV4';
import { Redirect } from 'react-router-dom';


class BScreen extends Component {
    state = {content: []}

    constructor(props) {
        super(props);

        registerScreen(this);

        this.addWindow = this.addWindow.bind(this);
        this.removeWindow = this.removeWindow.bind(this);
        this.routeToScreen = this.routeToScreen.bind(this);
    }


    addWindow(toAdd){
        let con = [...this.state.content];
        con.push(toAdd)
        this.setState({content: con});
        this.routeToScreen();
    }

    routeToScreen(navigateTo){
        this.setState({route: <Redirect to={"/"+ navigateTo} />})
    }

    removeWindow(id){
        let con = [...this.state.content];
        let toDelete = con.find(e => e.props.componentid === id);
        let indexToDelete = con.indexOf(toDelete);

        con.splice(indexToDelete,1);
        this.setState({content: con});
    }

    removeAll(){
        this.setState({content: []});
    }
}
 
export default BScreen;