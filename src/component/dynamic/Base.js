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
                if (prefSize.width < minSize.width) {
                    prefSize.setWidth(minSize.width);
                }
                if (prefSize.height < minSize.height) {
                    prefSize.setHeight(minSize.height);
                }
            }

            if (comp.props.data.maximumSize) {
                let maxSize = new Size(undefined, undefined, comp.props.data.maximumSize);
                if (maxSize.width < prefSize.width) {
                    prefSize.setWidth(maxSize.width);
                }
                if (maxSize.height < prefSize.height) {
                    prefSize.setHeight(maxSize.height);
                }
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
                if (maxSize.width < minSize.width) {
                    minSize.setWidth(maxSize.width);
                }
                if (maxSize.height < minSize.height) {
                    minSize.setHeight(maxSize.height);
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