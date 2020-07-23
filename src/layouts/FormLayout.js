import React, {Component, useDebugValue} from 'react';
import { Anchor } from "./layoutObj/Anchor";
import { Constraints } from "./layoutObj/Constraints";

class FormLayout extends Component {

    anchors = new Map();
    componentConstraints = new Map();

    leftBorderAnchor = new Anchor(undefined, undefined, undefined, 'horizontal', this);
    rightBorderAnchor = new Anchor(undefined, undefined, undefined, 'horizontal', this);
    topBorderAnchor = new Anchor(undefined, undefined, undefined, 'vertical', this);
    bottomBorderAnchor = new Anchor(undefined, undefined, undefined, 'vertical', this);

    leftMarginAnchor = new Anchor(undefined, this.leftBorderAnchor, 10, undefined, this);
    rightMarginAnchor = new Anchor(undefined, this.rightBorderAnchor, -10, undefined, this);
    topMarginAnchor = new Anchor(undefined, this.topBorderAnchor, 10, undefined, this);
    bottomMarginAnchor = new Anchor(undefined, this.bottomBorderAnchor, -10, undefined, this);

    preferredWidth;
    preferredHeight;
    minimumWidth;
    minimumHeight;

    componentDidMount() {
        this.getAnchorsAndConstraints();
        this.clearAutoSize();
        console.log(this.anchors.values())
        this.anchors.forEach(anchor => {
            this.initAutoSize(anchor)
        })
        this.props.subjects.forEach(subject => {
            let constraint = this.componentConstraints.get(subject)
            let preferredSize = this.props.getPreferredSize(subject)
            // console.log(preferredSize)
            // console.log(constraint.leftAnchor)
            // console.log(constraint.rightAnchor)
            console.log(subject)
            this.calculateAutoSize(constraint.leftAnchor, constraint.rightAnchor, preferredSize.getWidth(), 1)
            this.calculateAutoSize(constraint.topAnchor, constraint.bottomAnchor, preferredSize.getHeight(), 1)
        })
    }

    getAnchorsAndConstraints() {
        this.anchors.clear()

        this.anchors.set("t", this.topBorderAnchor);
        this.anchors.set("l", this.leftBorderAnchor);
        this.anchors.set("b", this.bottomBorderAnchor);
        this.anchors.set("r", this.rightBorderAnchor);
        this.anchors.set("tm", this.topMarginAnchor);
        this.anchors.set("lm", this.leftMarginAnchor);
        this.anchors.set("bm", this.bottomMarginAnchor);
        this.anchors.set("rm", this.rightMarginAnchor);

        var splittedAnchors = this.props.layoutData.split(';');
        splittedAnchors.forEach(anchorData => {
            this.getAnchor(anchorData)
        })

        this.getConstraints()

        for (var anchor of this.anchors.values()) {
            anchor.parseAnchorData()
        }
    }

    getAnchor(anchorData) {
        let name = anchorData.substring(0, anchorData.indexOf(','));
        if (name === '-') {
            return null
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

    getConstraints() {
        this.props.subjects.forEach(subject => {
            let constraint = new Constraints(this, subject.props.constraints, undefined, undefined, undefined, undefined)
            this.componentConstraints.set(subject, constraint);
        })
    }

    clearAutoSize() {
        for (var anchor of this.anchors.values()) {
            anchor.relative = anchor.autoSize;
            anchor.autoSizeCalculated = false;
            anchor.firstCalculation = true;
            if (anchor.autoSize) {
                anchor.position = 0;
            }
        }
    }

    initAutoSize(anchor) {
        if (anchor.relatedAnchor !== null && anchor.relatedAnchor.autoSize) {
            let relatedAutoSizeAnchor = anchor.relatedAnchor;
            if (relatedAutoSizeAnchor.relatedAnchor !== null && !relatedAutoSizeAnchor.relatedAnchor.autoSize) {
                relatedAutoSizeAnchor.position = -anchor.position
            }
        }
    }

    initAutoSize2(startAnchor, endAnchor) {
        let autoSizeAnchors = this.getAutoSizeAnchorsBetween(startAnchor, endAnchor);
        for (let i = 0; i < autoSizeAnchors.length; i++) {
            let anchor = autoSizeAnchors[i];
            anchor.relative = false;
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
        if (startAnchor === null) {
            autoSizeAnchors = [];
        }
        return autoSizeAnchors;
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
                console.log(anchor.position)
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
                    console.log('pos changed')
                    anchor.position = diffSize;
                }
                console.log(anchor.position)
            });
        }
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


