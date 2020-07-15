import React, { Component } from 'react';
import { RefContext } from './Context';
import { withRouter } from 'react-router-dom';

class Main extends Component {

    state = {}

    componentDidMount() {
        let windowData = this.context.contentSafe.getWindow(this.props.match.params.compId);

        if(windowData){
            let mainPanel = this.context.uiBuilder.compontentHandler(windowData)
            this.setState({content: mainPanel})
        }
    }

    render() { 
        return ( 
            <div>
                {this.state.content}
            </div>
        );
    }
}
Main.contextType = RefContext
export default withRouter(Main);