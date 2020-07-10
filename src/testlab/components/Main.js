import React, { Component } from 'react';
import Menu from './Menu';
import { RefContext } from './Context';
import { withRouter, Switch, Link } from 'react-router-dom';

class Main extends Component {

    state = {}

    constructor(props){
        super(props);
    }

    componentDidMount() {
        this.context.uiBuilder.setActiveWindow(this);
        this.contentSub = this.context.uiBuilder.contentEvent.subscribe(x => console.log(x))
    }

    componentWillUnmount() {
        this.contentSub.unsubscribe();
    }

    render() { 
        return ( 
            <div>
                <h1>MAIN</h1>
            </div>
        );
    }
}
Main.contextType = RefContext
export default withRouter(Main);