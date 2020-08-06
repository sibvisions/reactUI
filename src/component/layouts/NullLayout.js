import React, { Component } from 'react';
import { Bounds } from './layoutObj/Bounds';

class NullLayout extends Component {

    state = {
        content: [this.props.subjects]
    }

    components = this.props.subjects

    componentDidMount() {
        this.fillContent(this.components)
    }

    fillContent(components) {
        let tempContent = [];
        components.forEach(component => {
            console.log(component)
            let splittedBounds = components.props.data.bounds.split(',')
            let compBounds = new Bounds(splittedBounds);
            console.log(compBounds.height)
            let style = {
                position: "absolute",
                height: compBounds.height,
                width: compBounds.width,
                top: compBounds.top,
                left: compBounds.left,
            }
            let clonedComponent = React.cloneElement(component, { style: { ...component.props.style, ...style } })
            tempContent.push(clonedComponent);
        })
        this.setState({ content: tempContent })
    }

    render() {
        console.log(this.props.getPreferredSize(this.props.component))
        return (
            <div className="nulllayout" style={{position: "relative", height: this.props.getPreferredSize(this.props.component).height, overflow: 'hidden'}}>
                {this.state.content}
            </div>
        )
    }
}
export default NullLayout