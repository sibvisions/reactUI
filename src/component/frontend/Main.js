import React, { Component } from 'react';
import { RefContext } from '../helper/Context';
import { withRouter } from 'react-router-dom';
import { stretch } from "./Stretch";

import "./Main.scss";


class Main extends Component {

    state = {}

    componentDidMount() {
        let windowData = this.context.contentSafe.getWindow(this.props.match.params.compId);
        stretch('content-sidemenu');

        if(windowData){
            let mainPanel = this.context.uiBuilder.compontentHandler(windowData)
            this.setState({content: mainPanel})
        }
    }

    render() { 
        return (
            <div className={"content-" + this.context.menuLocation + "menu"}>
                <div className="p-grid parent-grid">
                    {this.state.content}
                </div>
            </div>
        );
    }
}
Main.contextType = RefContext
export default withRouter(Main);