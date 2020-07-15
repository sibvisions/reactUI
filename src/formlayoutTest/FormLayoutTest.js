import React, { Component } from 'react';

class FormLayoutTest extends Component {

    layoutPositioning = []
    anchors = [
        {
            name: 'r',
            related: '-',
            position1: '0',
            position2: '0',
            childAnchor: {
                name: 'rm',
                related: 'r',
                position1: '-10',
                position2: '-10'
            }
        },
        {
            name: 't',
            related: '-',
            position1: '0',
            position2: '0',
            childAnchor: {
                name: 'tm',
                related: 't',
                position1: '10',
                position2: '10',
                childAnchor: {
                    name: 'b0',
                    related: 'tm',
                    position1: '0',
                    position2: '0',
                }
            }
        }
    ]

    componentDidMount() {
        this.extractAnchors()
        this.buildAnchorHierarchy()
    }

    render() {
        return(
            <div>yo</div>
        )
    }
}
export default FormLayoutTest;