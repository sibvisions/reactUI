import React, {Component} from 'react';
import { Anchor } from "./layoutObj/Anchor";
import { Constraints } from "./layoutObj/Constraints";
import { Size } from '../../component/helper/Size';
import { RefContext } from '../../component/helper/Context';

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
        this.layoutContainer()
        if (this.context.menuLocation === 'side') {
            const mutationObserver = new MutationObserver(mutationsList => {
                mutationsList.forEach(mutation => {
                    if (mutation.attributeName === 'class') {
                        setTimeout(() => this.layoutContainer(), 400)
                    }
                })
            })
            mutationObserver.observe(
                document.getElementsByClassName('menu-container')[0],
                { attributes: true }
            )
        }
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
            let constraint = new Constraints(this, component.props.data.constraints, undefined, undefined, undefined, undefined)
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
            });
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

    calculateRelativeAnchor(leftTopAnchor, rightBottomAnchor, preferredSize) {
        if (leftTopAnchor.relative) {
            let rightBottom = rightBottomAnchor.getRelativeAnchor();
            if (rightBottom !== null && rightBottom !== leftTopAnchor) {
                let pref = rightBottom.getAbsolutePosition() - rightBottomAnchor.getAbsolutePosition() + preferredSize;
                let size = rightBottom.relatedAnchor.getAbsolutePosition() - leftTopAnchor.relatedAnchor.getAbsolutePosition();
                let pos = pref - size;

                if (pos < 0) {
                    pos /= 2;
                }
                else {
                    pos -= pos / 2;
                }
                if (rightBottom.firstCalculation || pos > rightBottom.position) {
                    rightBottom.firstCalculation = false;
                    rightBottom.position = pos;
                }
                pos = pref - size - pos;
                if (leftTopAnchor.firstCalculation || pos > -leftTopAnchor.position) {
                    leftTopAnchor.firstCalculation = false;
                    leftTopAnchor.position = -pos;
                }
            }
        }
        else if (rightBottomAnchor.relative) {
            let leftTop = leftTopAnchor.getRelativeAnchor();
            if (leftTop !== null && leftTop !== rightBottomAnchor) {
                let pref = leftTopAnchor.getAbsolutePosition() - leftTop.getAbsolutePosition() + preferredSize;
                let size = rightBottomAnchor.relatedAnchor.getAbsolutePosition() - leftTop.relatedAnchor.getAbsolutePosition();
                let pos = pref - size;

                if (pos < 0) {
                    pos -= pos / 2;
                }
                else {
                    pos /= 2;
                }
                if (leftTop.firstCalculation || pos < leftTop.position) {
                    leftTop.firstCalculation = false;
                    leftTop.position = pos;
                }
                pos = pref - size - pos;
                if (rightBottomAnchor.firstCalculation || pos > -rightBottomAnchor.position) {
                    rightBottomAnchor.firstCalculation = false;
                    rightBottomAnchor.position = -pos;
                }
            }
        }
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
            else if (leftWidth !== 0) {
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
            if (topHeight !== 0 && bottomHeight !== 0) {
                let h = topHeight + bottomHeight + this.props.gaps.getVerticalGap();
                if (h > this.preferredHeight) {
                    this.preferredHeight = h;
                }
                if (h > this.minimumHeight) {
                    this.minimumHeight = h;
                }
            }
            else if (topHeight !== 0) {
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
            let size = this.props.getPreferredSize(this.props.component);
            let minSize = this.minimumLayoutSize();
            let maxSize = this.maximumLayoutSize();

            if (this.horizontalAlignment === 'stretch' || (this.leftBorderUsed && this.rightBorderUsed)) {
                if (minSize.getWidth() > size.getWidth()) {
                    this.leftBorderAnchor.position = 0;
                    this.rightBorderAnchor.position = minSize.getWidth();
                }
                else if (maxSize.getWidth() < size.getWidth()) {
                    switch (this.horizontalAlignment) {
                        case 'left':
                            this.leftBorderAnchor.position = 0;
                            break;
                        case 'right':
                            this.leftBorderAnchor.position = size.getWidth() - maxSize.getWidth();
                            break;
                        default:
                            this.leftBorderAnchor.position = (size.getWidth() - maxSize.getWidth()) / 2;
                    }
                    this.rightBorderAnchor.position = this.leftBorderAnchor + maxSize.getWidth();
                }
                else {
                    this.leftBorderAnchor.position = 0;
                    this.rightBorderAnchor.position = size.getWidth();
                }
            }
            else {
                if (this.preferredWidth > size.getWidth()) {
                    this.leftBorderAnchor.position = 0;
                }
                else {
                    switch (this.horizontalAlignment) {
                        case 'left':
                            this.leftBorderAnchor.position = 0;
                            break;
                        case 'right':
                            this.leftBorderAnchor.position = size.getWidth() - this.preferredWidth;
                            break;
                        default:
                            this.leftBorderAnchor.position = (size.getWidth() - this.preferredWidth) / 2;
                    }
                }
                this.rightBorderAnchor.position = this.leftBorderAnchor + this.preferredWidth
            }
            if (this.verticalAlignment === 'stretch' || (this.topBorderUsed && this.bottomBorderUsed)) {
                if (minSize.getHeight() > size.getHeight()) {
                    this.topBorderAnchor.position = 0;
                    this.bottomBorderAnchor.position = minSize.getHeight();
                }
                else if (maxSize.getHeight() < size.getHeight()) {
                    switch (this.verticalAlignment) {
                        case 'top':
                            this.topBorderAnchor.position = 0;
                            break;
                        case 'bottom':
                            this.topBorderAnchor.position = size.getHeight() - maxSize.getHeight();
                            break;
                        default:
                            this.topBorderAnchor.position = (size.getHeight() - maxSize.getHeight()) / 2;
                    }
                    this.bottomBorderAnchor.position = this.topBorderAnchor.position + maxSize.getHeight();
                }
                else {
                    this.topBorderAnchor.position = 0;
                    this.bottomBorderAnchor.position = size.getHeight();
                }
            }
            else {
                if (this.preferredHeight > size.getHeight()) {
                    this.topBorderAnchor.position = 0;
                }
                else {
                    switch (this.verticalAlignment) {
                        case 'top':
                            this.topBorderAnchor.position = 0;
                            break;
                        case 'bottom':
                            this.topBorderAnchor.position = size.getHeight() - this.preferredHeight;
                            break;
                        default:
                            this.topBorderAnchor.position = (size.getHeight() - this.preferredHeight) / 2;
                    }
                }
                this.bottomBorderAnchor.position = this.topBorderAnchor.position + this.preferredHeight;
            }
            //INSETS??

            this.components.forEach(component => {
                let constraint = this.componentConstraints.get(component);
                let preferredSize = this.props.getPreferredSize(component);

                this.calculateRelativeAnchor(constraint.leftAnchor, constraint.rightAnchor, preferredSize.getWidth());
                this.calculateRelativeAnchor(constraint.topAnchor, constraint.bottomAnchor, preferredSize.getHeight());
            });
            this.vCalculateTargetDependentAnchors = false;
        }
    }

    buildComponents(components) {
        let tempContent = []
        components.forEach(component => {
            let constraint = this.componentConstraints.get(component);
            let minimumSize = this.props.getMinimumSize(component);
            let maximumSize = this.props.getMaximumSize(component);
            let compHeight = constraint.bottomAnchor.getAbsolutePosition() - constraint.topAnchor.getAbsolutePosition();
            if (compHeight > this.preferredHeight) {
                compHeight = this.preferredHeight;
            }
            let compWidth = constraint.rightAnchor.getAbsolutePosition() - constraint.leftAnchor.getAbsolutePosition();
            if (compWidth > this.preferredWidth) {
                compWidth = this.preferredWidth;
            }
            let formElement = <div
                                className={"formlayout-component-wrapper"}
                                style={{
                                    position: 'absolute',
                                    height: compHeight,
                                    width: compWidth,
                                    left: constraint.leftAnchor.getAbsolutePosition(),
                                    right: constraint.rightAnchor.getAbsolutePosition(),
                                    top: constraint.topAnchor.getAbsolutePosition(),
                                    bottom: constraint.bottomAnchor.getAbsolutePosition(),
                                    minHeight: minimumSize.getHeight(),
                                    minWidth: minimumSize.getWidth(),
                                    maxHeight: maximumSize.getHeight(),
                                    //maxWidth: maximumSize.getWidth()
                                }}>{component}</div>;
            tempContent.push(formElement)
        });
        this.setState({content: tempContent})
    }

    layoutContainer() {
        this.valid = false;
        this.calculateAnchors()
        this.calculateTargetDependentAnchors()
        this.buildComponents(this.props.subjects)
        this.calculateTop()
    }

    calculateTop() {
        let el = document.getElementById(this.props.component.props.data.id).parentElement
        if (el.className === "formlayout-component-wrapper") {
            el.style.height = this.preferredHeight + 'px';
        }

        if (el.previousSibling !== null)
            if (el.previousSibling.getElementsByClassName("formlayout").length > 0) {
                let posTop = parseInt(el.previousSibling.style.height) + parseInt(el.previousSibling.style.top)
                el.style.top = (parseInt(el.style.top) + parseInt(posTop)) + 'px'
            }
    }

    render() {
        window.onresize = () => {
            this.layoutContainer()
        }
        return (
            <div className={"formlayout " + this.props.component.props.data.id} style={{
                                        position: 'relative',
                                        width: this.preferredWidth, 
                                        height: this.preferredHeight
                                        }}>{this.state.content}</div>
        )
    }
}
FormLayout.contextType = RefContext
export default FormLayout;


