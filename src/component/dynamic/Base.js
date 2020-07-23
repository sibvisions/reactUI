import React, { Component } from 'react';
import { RefContext } from '../helper/Context';
import { Size } from '../helper/Size';

class Base extends Component {

    state = {  }
    
    componentDidMount() {
        let content = [];
        content.length = 0
        if (this.props.subjects) {
            this.props.subjects.forEach(subject => {
                let temp = this.context.uiBuilder.compontentHandler(subject);
                temp ? content.push(temp) : console.log();
            });
            this.setState({content: content});
            
        }
    }

    getPreferredSize(comp) {
        let compSize;
        if (comp) {
            if (comp.props.preferredSize) {
                compSize = new Size(undefined, undefined, comp.props.preferredSize)
            }
            else {
                    let x = document.getElementById(comp.props.id);
                    compSize = new Size(x.offsetWidth, x.offsetHeight, undefined)
            }
            return compSize
        }
    }

}
Base.contextType = RefContext
export default Base;