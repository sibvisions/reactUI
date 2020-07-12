import React, { Component } from 'react';
import { RefContext } from './Context';
import { withRouter } from 'react-router-dom';

class Main extends Component {

    state = {}

    componentDidMount() {
        let windowData = this.context.uiBuilder.contentSafe.getWindow(this.props.match.params.compId);
        this.context.uiBuilder.setActiveWindow(this);

        if(windowData){
            let mainPanel = this.context.uiBuilder.compontentHandler(windowData)
            console.log(mainPanel)
            this.setState({content: mainPanel})
        }
    }

    componentWillUnmount() {

    }
    render() { 
        return ( 
            <div>
                {this.state.content}
                {this.props.match.params.compId}
                <h1>MAIN</h1>
            </div>
        );
    }
}
Main.contextType = RefContext
export default withRouter(Main);