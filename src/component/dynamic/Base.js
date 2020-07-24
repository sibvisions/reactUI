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
        let prefSize;
        if (comp) {
            if (comp.props.preferredSize) {
                prefSize = new Size(undefined, undefined, comp.props.preferredSize)
            }
            else {
                    let x = document.getElementById(comp.props.id);
                    prefSize = new Size(x.offsetWidth, x.offsetHeight, undefined)
            }

            if (comp.props.minimumSize) {
                let minSize = new Size(undefined, undefined, comp.props.minimumSize)
                if (prefSize.getWidth() < minSize.getWidth()) {
                    prefSize.setWidth(minSize.getWidth());
                }
                if (prefSize.getHeight() < minSize.getHeight()) {
                    prefSize.setHeight(minSize.getHeight());
                }
            }

            if(comp.props.maximumSize) {
                let maxSize = new Size(undefined, undefined, comp.props.maximumSize);
                if (maxSize.getWidth() < prefSize.getWidth) {
                    prefSize.setWidth(maxSize.getWidth());
                }
                if (maxSize.getHeight() < prefSize.getHeight()) {
                    prefSize.setHeight(maxSize.getHeight());
                }
            }
            return prefSize
        }
    }

    getMinimumSize(comp) {
        let minSize;
        if (comp.props.minimumSize) {
            minSize = new Size(undefined, undefined, comp.props.minimumSize);
        }
        else {
            minSize = this.getPreferredSize(comp);
        }

        if (comp.props.maximumSize) {
            let maxSize = new Size(undefined, undefined, comp.props.maximumSize);
            if (maxSize.getWidth() < minSize.getWidth) {
                minSize.setWidth(maxSize.getWidth());
            }
            if (maxSize.getHeight() < minSize.getHeight()) {
                minSize.setHeight(maxSize.getHeight());
            }
        }
    }

}
Base.contextType = RefContext
export default Base;