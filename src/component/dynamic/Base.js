import { Component } from 'react';
import { RefContext } from '../helper/Context';
import { Size } from '../helper/Size';

class Base extends Component {

    state = { 
        
    }

    startUp(){

        let style = {
            width: '100%',
            height: '100%'
        } 
        let content = [];
        content.length = 0
        if (this.props.data.subjects) {
            this.props.data.subjects.forEach(subject => {
                let temp = this.context.uiBuilder.compontentHandler(subject);
                if(temp) content.push(temp)
            });
            this.setState({content: content, style: style});
        }else {this.setState({style:style})}
        

    }

    getPreferredSize(comp) {
        let prefSize;
        if (comp) {
            if (comp.props.data.preferredSize) {
                prefSize = new Size(undefined, undefined, comp.props.data.preferredSize)
            }
            else {
                let element = document.getElementById(comp.props.data.id);
                if (element.getBoundingClientRect()) {
                    prefSize = new Size(Math.ceil(element.getBoundingClientRect().width), Math.ceil(element.getBoundingClientRect().height), undefined)
                }
                else {
                    prefSize = new Size(element.offsetWidth, element.offsetHeight, undefined)
                }
            }
            if (comp.props.data.minimumSize) {
                let minSize = new Size(undefined, undefined, comp.props.data.minimumSize)
                if (prefSize.getWidth() < minSize.getWidth()) {
                    prefSize.setWidth(minSize.getWidth());
                }
                if (prefSize.getHeight() < minSize.getHeight()) {
                    prefSize.setHeight(minSize.getHeight());
                }
            }

            if (comp.props.data.maximumSize) {
                let maxSize = new Size(undefined, undefined, comp.props.data.maximumSize);
                if (maxSize.getWidth() < prefSize.getWidth) {
                    prefSize.setWidth(maxSize.getWidth());
                }
                if (maxSize.getHeight() < prefSize.getHeight()) {
                    prefSize.setHeight(maxSize.getHeight());
                }
            }

            if (comp.props.data.id.substring(0, 1) === 'P') {
                prefSize.height -= 16;
                prefSize.width = prefSize.width - 16;
            }
            return prefSize
        }
    }
    
    componentDidMount() {
        this.startUp();
    }

    getMinimumSize(comp) {
        let minSize;
        if (comp) {
            if (comp.props.data.minimumSize) {
                minSize = new Size(undefined, undefined, comp.props.data.minimumSize);
            }
            else {
                minSize = this.getPreferredSize(comp);
            }
    
            if (comp.props.data.maximumSize) {
                let maxSize = new Size(undefined, undefined, comp.props.data.maximumSize);
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
            if (comp.props.data.maximumSize) {
                maxSize = new Size(undefined, undefined, comp.props.data.maximumSize);
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