import React, { Component } from 'react';

class FormLayout extends Component {

    layoutPositioning = []
    anchors = []
    hierarchedAnchors = []

    componentDidMount() {
        this.extractAnchors()
        this.buildAnchorHierarchy()
    }

    extractAnchors() {
        var rawAnchors = this.props.layoutData.split(';');
        rawAnchors.forEach(anchorString => {
            let anchor = {};
            anchor.name = anchorString.split(',')[0];
            anchor.related = anchorString.split(',')[1];
            anchor.position1 = anchorString.split(',')[3];
            anchor.position2 = anchorString.split(',')[4];
            this.anchors.push(anchor);
        });
    }

    buildAnchorHierarchy() {
        this.anchors.forEach(anchor => {
            if(this.anchors.find(e => e.name === anchor.related)) {
                let related = this.anchors.find(e => e.name === anchor.related);
                related[0] = anchor
                if(related.related === '-') {
                    this.hierarchedAnchors.push(related)
                }
            }
        })
        console.log(this.hierarchedAnchors)
    }

    render() {
        return(
            <div>yo</div>
        )
    }
}
export default FormLayout;