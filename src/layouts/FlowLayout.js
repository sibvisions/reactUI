import React, { Component } from 'react';

class FlowLayout extends Component {

    layoutPositioning = []
    anchors = []

    componentDidMount() {
        this.extractAnchors()
    }

    extractAnchors() {
        var rawAnchors = this.props.layoutData.split(';')
        rawAnchors.forEach(anchor => {
            
        });
        console.log(rawAnchors)
    }

    render() {
        return(
            <div>yo</div>
        )
    }
}
export default FlowLayout;