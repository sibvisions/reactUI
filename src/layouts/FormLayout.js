import React, {Component} from 'react';
import { Anchor } from "./layoutObj/Anchor";
import { Constraints } from "./layoutObj/Constraints";
import { Size } from '../component/helper/Size';

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

    horizontalAlignment = this.props.alignments.hAlignment;
    verticalAlignment = this.props.alignments.vAlignment;

    leftBorderUsed = false;
    rightBorderUsed = false;
    topBorderUsed = false;
    bottomBorderUsed = false;

    preferredWidth;
    preferredHeight;
    minimumWidth;
    minimumHeight;

    valid = false;
    vCalculateTargetDependentAnchors = false;

    state = {
        content: [this.components]
    }

    componentDidMount() {
        this.calculateAnchors()
        this.calculateTargetDependentAnchors()
        this.buildComponents(this.props.subjects)
        console.log(this)
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

    minimumLayoutSize() {
        if (this.props.minimumSize) {
            return this.props.getMinimumSize(this);
        }
        else {
            return new Size(this.minimumWidth, this.minimumHeight, undefined);
        }
    }

    preferredLayoutSize() {
        this.calculateAnchors();
        return new Size(this.preferredWidth, this.preferredHeight, undefined);
    }

    maximumLayoutSize() {
        if (this.props.maximumSize) {
            return this.props.getMaximumSize(this)
        }
        else {
            return new Size(Math.pow(2, 31) - 1, Math.pow(2, 31) - 1, undefined);
        }
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
            if(!anchor.firstCalculation) {
                anchor.autoSizeCalculated = true;
                count--;
            }
        }
        return count
    }

    calculateAnchors() {
        if (!this.valid) {
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
                if (constraint.leftAnchor.getBorderAnchor() === this.leftBorderAnchor && constraint.rightAnchor.getBorderAnchor() === this.rightBorderAnchor) {
                    let w = constraint.leftAnchor.getAbsolutePosition() - constraint.rightAnchor.getAbsolutePosition() + preferredSize.getWidth();
                    console.log(w)
                    if (w > this.preferredWidth) {
                        this.preferredWidth = w;
                    }
                    w = constraint.leftAnchor.getAbsolutePosition() - constraint.rightAnchor.getAbsolutePosition() + minimumSize.getWidth();
                    if (w > this.minimumWidth) {
                        this.minimumWidth = w;
                    }
                    this.leftBorderUsed = true;
                    this.rightBorderUsed = true;
                }
                if (constraint.topAnchor.getBorderAnchor() === this.topBorderAnchor && constraint.bottomAnchor.getBorderAnchor() === this.bottomBorderAnchor) {
                    let h = constraint.topAnchor.getAbsolutePosition() - constraint.bottomAnchor.getAbsolutePosition() + preferredSize.getHeight();
                    if (h > this.preferredHeight) {
                        this.preferredHeight = h;
                    }
                    h = constraint.topAnchor.getAbsolutePosition() - constraint.bottomAnchor.getAbsolutePosition() + minimumSize.getHeight();
                    if (h > this.minimumHeight) {
                        this.minimumHeight = h;
                    }
                    this.topBorderUsed = true;
                    this.bottomBorderUsed = true;
                }
            });
            if (leftWidth !== 0 && rightWidth !== 0) {
                let w = leftWidth + rightWidth + this.props.gaps.getHorizontalGap();
                if (w > this.preferredWidth) {
                    this.preferredWidth = w;
                }
                if (w > this.minimumWidth) {
                    this.minimumWidth = w;
                }
            }
            else if (leftWidth != 0) {
                let w = leftWidth - this.rightMarginAnchor.position;
                if (w > this.preferredWidth) {
                    this.preferredWidth = w;
                }
                if (w > this.minimumWidth) {
                    this.minimumWidth = w;
                }
            }
            else {
                let w = rightWidth + this.leftMarginAnchor.position;
                if (w > this.preferredWidth) {
                    this.preferredWidth = w;
                }
                if (w > this.minimumWidth) {
                    this.minimumWidth = w;
                }
            }
            if (topHeight != 0 && bottomHeight != 0) {
                let h = topHeight + bottomHeight + this.props.gaps.getVerticalGap();
                if (h > this.preferredHeight) {
                    this.preferredHeight = h;
                }
                if (h > this.minimumHeight) {
                    this.minimumHeight = h;
                }
            }
            else if (topHeight != 0) {
                let h = topHeight - this.bottomMarginAnchor.position;
                if (h > this.preferredHeight) {
                    this.preferredHeight = h;
                }
                if (h > this.minimumHeight) {
                    this.minimumHeight = h;
                }
            }
            else {
                let h = bottomHeight + this.topMarginAnchor.position;
                if (h > this.preferredHeight) {
                    this.preferredHeight = h;
                }
                if (h > this.minimumHeight) {
                    this.minimumHeight = h;
                }
            }
    
            //INSETS??
            // let margins = this.props.margins;
    
            // this.preferredWidth += margins.getMarginLeft() + margins.getMarginRight();
            // this.preferredHeight += margins.getMarginTop() + margins.getMarginBottom();
    
            // this.minimumWidth += margins.getMarginLeft() + margins.getMarginRight();
            // this.minimumHeight += margins.getMarginTop() + margins.getMarginBottom();
    
            this.vCalculateTargetDependentAnchors = true;
            this.valid = true;
        }
    }

    calculateTargetDependentAnchors() {
        if (this.vCalculateTargetDependentAnchors) {
            let size = new Size(this.preferredWidth, this.preferredHeight, undefined);
            let minSize = this.minimumLayoutSize();
            let maxSize = this.maximumLayoutSize();
        }
    }

    buildComponents(components) {
        let tempContent = []
        components.forEach(component => {
            let constraint = this.componentConstraints.get(component);
            let preferredSize = this.props.getPreferredSize(component);
            let minimumSize = this.props.getMinimumSize(component);
            let maximumSize = this.props.getMaximumSize(component);
            let formElement = <div style={{
                                    position: 'absolute',
                                    height: preferredSize.getHeight(),
                                    width: preferredSize.getWidth(),
                                    left: constraint.leftAnchor.getAbsolutePosition(),
                                    right: constraint.rightAnchor.getAbsolutePosition(),
                                    top: constraint.topAnchor.getAbsolutePosition(),
                                    bottom: constraint.bottomAnchor.getAbsolutePosition(),
                                    minHeight: minimumSize.getHeight(),
                                    minWidth: minimumSize.getWidth(),
                                    maxHeight: maximumSize.getHeight(),
                                    maxWidth: maximumSize.getWidth()
                                }}>{component}</div>;
            tempContent.push(formElement)
        });
        this.setState({content: tempContent})
    }

    render() {
        return (
            <div className="formlayout" style={{position: 'relative', width: this.preferredWidth, height: this.preferredHeight}}>
                {this.state.content}
            </div>
        )
    }
}
export default FormLayout;


