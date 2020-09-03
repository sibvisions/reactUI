import React, { Component } from 'react';
import { Bounds } from './layoutObj/Bounds';

class NullLayout extends Component {

    state = {
        content: [this.props.subjects]
    }

    components = this.props.subjects
    preferredHeight;
    preferredWidth;

    componentDidMount() {
        this.calculateLayoutSize()
        this.layoutContainer(this.components)
    }

    calculateLayoutSize() {
        if (this.props.constraints === "Center" || this.props.constraints === undefined) {
            this.preferredWidth = document.getElementById(this.props.id).parentElement.clientWidth;
            this.preferredHeight = document.getElementById(this.props.id).parentElement.clientHeight;
        }
        else {
            let furthest = 0;
            let deepest = 0;
            this.components.forEach(component => {
                let compBounds = new Bounds(component.props.bounds.split(','));
                if (compBounds.top + compBounds.height > deepest) {
                    deepest = compBounds.top + compBounds.height;
                }
                if (compBounds.left + compBounds.width > furthest) {
                    furthest = compBounds.left + compBounds.width;
                }
            });
            this.preferredWidth = furthest;
            this.preferredHeight = deepest;
        }
    }

    layoutContainer(components) {
        let tempContent = [];
        components.forEach(component => {
            if (component.props.visible === undefined || component.props.visible) {
                let compBounds = new Bounds(component.props.bounds.split(','));
                 
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
                height: this.preferredHeight,
                width: this.preferredWidth,
                overflow: 'hidden'}}>
                {this.state.content}
            </div>
        )
    }
}
export default NullLayout