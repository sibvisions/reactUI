import React, { Component } from 'react';
import { RefContext } from '../helper/Context';
import { Size } from '../helper/Size';

class Base extends Component {

    state = {  }
    
    componentDidMount() {
        let content = [];
        content.length = 0
        this.getPreferredSize()
        if (this.props.subjects){
            this.props.subjects.forEach(subject => {
                let temp = this.context.uiBuilder.compontentHandler(subject);
                temp ? content.push(temp) : console.log();
            });
            this.setState({content: content});
            
        }
    }

    getPreferredSize() {
        let compSize;
        if (this.compRef) {
            if (this.props.preferredSize) {
                compSize = this.props.preferredSize
            }
            else {
                compSize = new Size(this.compRef.offsetWidth, this.compRef.offsetHeight, undefined)
            }
            return compSize
        }
        
    }

}
Base.contextType = RefContext
export default Base;