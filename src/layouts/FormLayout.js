import React, {Component} from 'react';
import { Anchor } from "./layoutObj/Anchor";
import { Constraints } from "./layoutObj/Constraints";

class FormLayout extends Component {

    anchors = new Map();
    componentConstraints = new Map();
    preferredWidth;
    preferredHeight;
    minimumWidth;
    minimumHeight;


    constructor(props) {
        super(props)

        this.borderAnchors = new Constraints(
            undefined, undefined,
            new Anchor(undefined, undefined, undefined, 'vertical', this),
            new Anchor(undefined, undefined, undefined, 'horizontal', this),
            new Anchor(undefined, undefined, undefined, 'vertical', this),
            new Anchor(undefined, undefined, undefined, 'horizontal', this));
        
        this.marginAnchors = new Constraints(
            undefined, undefined,
            new Anchor(undefined, this.borderAnchors.topAnchor, 10, undefined, this),
            new Anchor(undefined, this.borderAnchors.leftAnchor, 10, undefined, this),
            new Anchor(undefined, this.borderAnchors.bottomAnchor, -10, undefined, this),
            new Anchor(undefined, this.borderAnchors.rightAnchor, -10, undefined, this));
    }

    componentDidMount() {
        this.calculateAutoSize(this.anchors.get("l"), this.anchors.get("lm"))
    }

    getAnchor(anchorData) {
        let name = anchorData.substring(0, anchorData.indexOf(','));
        if (name === '-') {
            return null;
        }
        let anchor = this.anchors.get(name)
        if (anchor === undefined) {
            anchor = new Anchor(anchorData, undefined, undefined, undefined, this)
            this.anchors.set(name, anchor)
        }
        else {
            anchor.setAnchorData(anchorData)
        }
        return anchor
    }

    clearAutoSize(anchorList, anchor) {
        while (anchor !== null && anchorList.includes(anchor)) {
            anchorList.push(anchor);
            anchor.relative = anchor.autoSize;
            anchor.autoSizeCalculated = false;
            anchor.firstCalculation = true
        }
    }

    calculateAutoSize(leftTopAnchor, rightBottomAnchor, preferredSize, autoSizeCount) {

        let autoSizeAnchors = this.getAutoSizeAnchorsBetween(leftTopAnchor, rightBottomAnchor)
        let size = autoSizeAnchors.length;

        if (size === autoSizeCount) {
            let fixedSize = rightBottomAnchor.getAbsolutePosition() - leftTopAnchor.getAbsolutePosition();
            autoSizeAnchors.forEach(anchor => {
                fixedSize += anchor.position
            })

            let diffSize = (preferredSize - fixedSize + size -1) / size;
            autoSizeAnchors.forEach(anchor => {
                if (diffSize > -anchor.position) {
                    anchor.position = -diffSize;
                }
            });
        }

        autoSizeAnchors = this.getAutoSizeAnchorsBetween(rightBottomAnchor, leftTopAnchor)
        size = autoSizeAnchors.length;

        if (size === autoSizeCount) {
            let fixedSize = rightBottomAnchor.getAbsolutePosition() - leftTopAnchor.getAbsolutePosition();
            autoSizeAnchors.forEach(anchor => {
                fixedSize -= anchor.position;
            });

            let diffSize = (preferredSize - fixedSize + size - 1) / size;
            autoSizeAnchors.forEach(anchor => {
                if (diffSize > anchor.position) {
                    anchor.position = diffSize
                }
            })
        }
    }

    getAutoSizeAnchorsBetween(startAnchor, endAnchor) {
        let autoSizeAnchors = [];
        while (startAnchor !== null && startAnchor !== endAnchor) {
            if (startAnchor.autoSize && !startAnchor.autoSizeCalculated) {
                autoSizeAnchors.push(startAnchor);
            }
            startAnchor = startAnchor.relatedAnchor;
        }
        if (startAnchor === undefined) {
            autoSizeAnchors = [];
        }
        return autoSizeAnchors;
    }

    calculateAutoSizeAnchors(autoSizeCount) {
        this.props.subjects.forEach(subject => {
            //let preferredSize;
            let constraint = this.componentConstraints.get(subject);
            if ((!constraint.rightAnchor.autoSize && constraint.rightAnchor.relatedAnchor !== null && constraint.leftAnchor.position === constraint.rightAnchor.relatedAnchor.position)
                || (!constraint.leftAnchor.autoSize && constraint.leftAnchor.relatedAnchor !== null && constraint.rightAnchor.position === constraint.leftAnchor.relatedAnchor.position)) {
            }
        })
    }

    calculateSizes() {
        let topBorderUsed = false;
        let leftBorderUsed = false;
        let bottomBorderUsed = false;
        let rightBorderUsed = false;

        let topHeight = 0;
        let leftWidth = 0;
        let bottomHeight = 0;
        let rightWidth = 0;

        this.props.subjects.forEach(subject => {
            let constraint = this.componentConstraints.get(subject)
            //let preferredSize;
            //let minimumSize;
            if (constraint.bottomAnchor.getBorderAnchor() === this.borderAnchors.topAnchor) {
                let h = constraint.bottomAnchor.getAbsolutePosition();
                if (h > topHeight) {
                    topHeight = h;
                }
                topBorderUsed = true
            }

            if (constraint.rightAnchor.getBorderAnchor() === this.borderAnchors.leftAnchor) {
                let w = constraint.rightAnchor.getAbsolutePosition();
                if (w > leftWidth) {
                    leftWidth = w;
                }
                leftBorderUsed = true
            }

            if (constraint.topAnchor.getBorderAnchor() === this.borderAnchors.bottomAnchor) {
                let h = constraint.topAnchor.getAbsolutePosition();
                if (h > bottomHeight) {
                    bottomHeight = h;
                }
                bottomBorderUsed = true
            }

            if (constraint.leftAnchor.getBorderAnchor() === this.borderAnchors.rightAnchor) {
                let w = constraint.leftAnchor.getAbsolutePosition();
                if (w > rightWidth) {
                    rightWidth = w;
                }
                rightBorderUsed = true
            }

        })
    }

    render() {
        return (
        <div>{this.props.subjects}</div>
        )
    }
}
export default FormLayout;


