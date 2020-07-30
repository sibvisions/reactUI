import React, { Component } from 'react';
import { RefContext } from '../helper/Context';
import { Size } from '../helper/Size';

class Base extends Component {

    state = {  }
    
    componentDidMount() {
        let style = {
            width: '100%',
            height: '100%'
        }
        let content = [];
        content.length = 0
        if (this.props.subjects) {
            this.props.subjects.forEach(subject => {
                let temp = this.context.uiBuilder.compontentHandler(subject);
                temp ? content.push(temp) : console.log();
            });
            this.setState({content: content});
        }
        this.setState({style: style})
    }

    getPreferredSize(comp) {
        let prefSize;
        if (comp) {
            if (comp.props.preferredSize) {
                prefSize = new Size(undefined, undefined, comp.props.preferredSize)
            }
            else {
                let element = document.getElementById(comp.props.id);
                if (element.getBoundingClientRect()) {
                    prefSize = new Size(Math.ceil(element.getBoundingClientRect().width), Math.ceil(element.getBoundingClientRect().height), undefined)
                }
                else {
                    prefSize = new Size(element.offsetWidth, element.offsetHeight, undefined)
                }
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

            if (comp.props.maximumSize) {
                let maxSize = new Size(undefined, undefined, comp.props.maximumSize);
                if (maxSize.getWidth() < prefSize.getWidth) {
                    prefSize.setWidth(maxSize.getWidth());
                }
                if (maxSize.getHeight() < prefSize.getHeight()) {
                    prefSize.setHeight(maxSize.getHeight());
                }
            }

            if (comp.props.id.substring(0, 1) === 'P') {
                prefSize.height -= 16;
                prefSize.width = prefSize.width - 16;
            }
            return prefSize
        }
    }

    getMinimumSize(comp) {
        let minSize;
        if (comp) {
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
            return minSize
        }
    }

    getMaximumSize(comp) {
        let maxSize;
        if (comp) {
            if (comp.props.maximumSize) {
                maxSize = new Size(undefined, undefined, comp.props.maximumSize);
            }
            else {
                maxSize = new Size(Math.pow(2, 31) - 1, Math.pow(2, 31) - 1, undefined)
            }
            return maxSize;
        }
    }
}
Base.contextType = RefContext
export default Base;