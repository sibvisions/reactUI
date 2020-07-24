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

    components = this.props.subjects;

    leftBorderUsed = false;
    rightBorderUsed = false;
    topBorderUsed = false;
    bottomBorderUsed = false;

    preferredWidth;
    preferredHeight;
    minimumWidth;
    minimumHeight;

    componentDidMount() {
        this.calculateAnchors()
    }

    getAnchorsAndConstraints() {
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
        this.components.forEach(component => {
            let constraint = new Constraints(this, component.props.constraints, undefined, undefined, undefined, undefined)
            this.componentConstraints.set(component, constraint);
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

    initAutoSizeRelative(startAnchor, endAnchor) {
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
                anchor.firstCalculation = false;
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
                    anchor.position = diffSize;
                }
                anchor.firstCalculation = false;
            });
        }
    }

    finishAutoSizeCalculation(leftTopAnchor, rightBottomAnchor) {
        let autoSizeAnchors = this.getAutoSizeAnchorsBetween(leftTopAnchor, rightBottomAnchor);
        let count = autoSizeAnchors.length
        for(var i = 0; i < autoSizeAnchors.length; i++) {
            let anchor = autoSizeAnchors[i];
            console.log(anchor)
            if(!anchor.firstCalculation) {
                anchor.autoSizeCalculated = true;
                count--;
            }
        }
        return count
    }

    calculateAnchors() {
        this.topBorderAnchor.position = 0;
        this.leftBorderAnchor.position = 0;
        this.rightBorderAnchor.position = 0;
        this.bottomBorderAnchor.position = 0;

        this.preferredWidth = 0;
        this.preferredHeight = 0;

        this.minimumWidth = 0;
        this.minimumHeight = 0;
        
        this.anchors.clear();
        this.componentConstraints.clear();

        this.getAnchorsAndConstraints();
        this.clearAutoSize();
        this.anchors.forEach(anchor => {
            this.initAutoSize(anchor)
        })
        
        this.components.forEach(component => {
            let constraint = this.componentConstraints.get(component)

            this.initAutoSizeRelative(constraint.leftAnchor, constraint.rightAnchor);
            this.initAutoSizeRelative(constraint.rightAnchor, constraint.leftAnchor);
            this.initAutoSizeRelative(constraint.topAnchor, constraint.bottomAnchor);
            this.initAutoSizeRelative(constraint.bottomAnchor, constraint.topAnchor);
        })

        let autoSizeCount = 1
        do {
            this.components.forEach(component => {
                let constraint = this.componentConstraints.get(component)
                let preferredSize = this.props.getPreferredSize(component)

                this.calculateAutoSize(constraint.topAnchor, constraint.bottomAnchor, preferredSize.getHeight(), autoSizeCount);
                this.calculateAutoSize(constraint.leftAnchor, constraint.rightAnchor, preferredSize.getWidth(), autoSizeCount);
            });
            autoSizeCount = Math.pow(2, 31) - 1
            this.components.forEach(component => {
                let constraint = this.componentConstraints.get(component)
                let count = this.finishAutoSizeCalculation(constraint.leftAnchor, constraint.rightAnchor)
                if(count > 0 && count < autoSizeCount) {
                    autoSizeCount = count;
                }
                count = this.finishAutoSizeCalculation(constraint.rightAnchor, constraint.leftAnchor)
                if(count > 0 && count < autoSizeCount) {
                    autoSizeCount = count;
                }
                count = this.finishAutoSizeCalculation(constraint.topAnchor, constraint.bottomAnchor)
                if(count > 0 && count < autoSizeCount) {
                    autoSizeCount = count;
                }
                count = this.finishAutoSizeCalculation(constraint.bottomAnchor, constraint.topAnchor)
                if(count > 0 && count < autoSizeCount) {
                    autoSizeCount = count;
                }
            })
        } while (autoSizeCount > 0 && autoSizeCount < Math.pow(2, 31) - 1);

        this.leftBorderUsed = false;
        this.rightBorderUsed = false;
        this.topBorderUsed = false;
        this.bottomBorderUsed = false;
        
        let leftWidth = 0;
        let rightWidth = 0;
        let topHeight = 0;
        let bottomHeight = 0;

        this.components.forEach(component => {
            let constraint = this.componentConstraints.get(component);
            let preferredSize = this.props.getPreferredSize(component);
            let minimumSize = this.props.getMinimumSize(component);

            if (constraint.rightAnchor.getBorderAnchor() === this.leftBorderAnchor) {
                let w = constraint.rightAnchor.getAbsolutePosition();
                if (w > leftWidth) {
                    leftWidth = w;
                }
                this.leftBorderUsed = true;
            }
            if (constraint.leftAnchor.getBorderAnchor() === this.rightBorderAnchor) {
                let w = -constraint.leftAnchor.getAbsolutePosition();
                if (w > rightWidth) {
                    rightWidth = w;
                }
                this.rightBorderUsed = true;
            }
            if (constraint.bottomAnchor.getBorderAnchor() === this.topBorderAnchor) {
                let h = constraint.bottomAnchor.getAbsolutePosition();
                if (h > topHeight) {
                    topHeight = h
                }
                this.topBorderUsed = true;
            }
            if (constraint.topAnchor.getBorderAnchor() === this.bottomBorderAnchor) {
                let h = -constraint.topAnchor.getAbsolutePosition();
                if (h > bottomHeight) {
                    bottomHeight = h;
                }
                this.bottomBorderUsed = true
            }
        })

    }

    render() {
        return (
        <div>{this.components}</div>
        )
    }
}
export default FormLayout;


