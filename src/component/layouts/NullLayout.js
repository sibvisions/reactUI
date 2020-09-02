import React, { Component } from 'react';
import { Bounds } from './layoutObj/Bounds';
import { getPreferredSize } from '../helper/GetSizes';

class NullLayout extends Component {

    state = {
        content: [this.props.subjects]
    }

    components = this.props.subjects

    componentDidMount() {
        this.layoutContainer(this.components)
    }

    layoutContainer(components) {
        let tempContent = [];
        components.forEach(component => {
            if (component.props.visible === undefined || component.props.visible) {
                let splittedBounds = component.props.bounds.split(',')
                let compBounds = new Bounds(splittedBounds);
                 
                let layoutStyle = {
                    position: "absolute",
                    height: compBounds.height,
                    width: compBounds.width,
                    top: compBounds.top,
                    left: compBounds.left,
                }
                let clonedComponent = React.cloneElement(component, { layoutStyle: { ...layoutStyle } })
                tempContent.push(clonedComponent);
            }
        })
        this.setState({ content: tempContent })
    }

    render() {
         
        return (
            <div className="nulllayout" 
            style={{
                position: "relative", 
                height: getPreferredSize({
                    id: this.props.id, 
                    preferredSize: this.props.preferredSize, 
                    horizontalTextPosition: this.props.horizontalTextPosition,
                    minimumSize: this.props.minimumSize,
                    maximumSize: this.props.maximumSize
                }).height, 
                overflow: 'hidden'}}>
                {this.state.content}
            </div>
        )
    }
}
export default NullLayout