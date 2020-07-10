import React, {Component} from 'react';
import { Anchor } from "./layoutObj/Anchor";

class FormLayout extends Component {

    layoutPositioning = []
    anchors = []

    componentDidMount() {
        this.extractAnchors()
    }

    extractAnchors() {
        var splittedRawAnchors = this.props.layoutData.split(';');
        splittedRawAnchors.forEach(anchorString => {
            let anchor = new Anchor(anchorString, undefined, undefined, undefined, this);
            this.anchors.push(anchor);
        });   
        for (var i = 0; i <= 1; i++) {
            this.anchors.forEach(anchor => {
                    anchor.parseAnchorData()
            })
        }
        console.log(this.anchors)
    }

    render() {
        return(
            <div>yo</div>
        )
    }
}
export default FormLayout;


