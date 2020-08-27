import React, {Component} from 'react';
import { Anchor } from "./layoutObj/Anchor";
import { Constraints } from "./layoutObj/Constraints";
import { Size } from '../../component/helper/Size';
import { RefContext } from '../../component/helper/Context';
import { FindReact } from '../../component/helper/FindReact';
import { toPx } from '../helper/ToPx';
import { getPreferredSize } from '../helper/GetPreferredSize';

class FormLayout extends Component {

    currentPanelData = this.context.contentStore.flatContent.find(component => component.id === this.props.component.props.id);
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

    horizontalAlignment = this.props.alignments.ha;
    verticalAlignment = this.props.alignments.va;

    leftBorderUsed = false;
    rightBorderUsed = false;
    topBorderUsed = false;
    bottomBorderUsed = false;

    preferredWidth;
    preferredHeight;
    minimumWidth;
    minimumHeight;

    compSizes = new Map();
    anzComps = this.props.subjects.length;

    prevTop;

    valid = false;
    firstPosCalc = false;
    vCalculateTargetDependentAnchors = false;

    state = {
        content: [this.components]
    }

    componentDidMount() {
        this.anzComps = this.props.subjects.length;
        this.sizeSub = this.context.contentStore.onSizeCalculated.subscribe(sizedComps => {
            if (sizedComps.parent === this.props.component.props.id) {
                this.compSizes.set(sizedComps.id, sizedComps.size);
                if (sizedComps.firstTime) {
                    this.anzComps--;
                }
                if (this.anzComps === 0) {
                    const someElements = document.getElementsByClassName("formlayout")
                    for (const element of someElements) {
                        const myComp = FindReact(element)
                        myComp.layoutContainer();
                    }
                }
            }
        })

        const someElements = document.getElementsByClassName("formlayout")
        for (const element of someElements) {
            const myComp = FindReact(element)
            myComp.layoutContainer();
        }

        window.addEventListener("resize", () => {
            const someElements = document.getElementsByClassName("formlayout")
            for (const element of someElements) {
                const myComp = FindReact(element)
                myComp.layoutContainer();
            }
        });

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
        this.context.contentStore.emitSizeCalculated({size: new Size(this.preferredWidth, this.preferredHeight), id: this.props.component.props.id, parent: this.props.component.props.parent});
    }

    componentWillUnmount() {
        this.sizeSub.unsubscribe();
        window.removeEventListener("resize", () => {
            const someElements = document.getElementsByClassName("formlayout")
            for (const element of someElements) {
                const myComp = FindReact(element)
                myComp.layoutContainer();
            }
        });
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
 
        var splittedAnchors = this.currentPanelData.layoutData.split(';');
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
        this.currentPanelData.subjects.forEach(component => {
            let constraint = new Constraints(this, component.constraints, undefined, undefined, undefined, undefined)
            this.componentConstraints.set(component.id, constraint);
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
                let constraint = this.componentConstraints.get(component.props.id)
                this.initAutoSizeRelative(constraint.leftAnchor, constraint.rightAnchor);
                this.initAutoSizeRelative(constraint.rightAnchor, constraint.leftAnchor);
                this.initAutoSizeRelative(constraint.topAnchor, constraint.bottomAnchor);
                this.initAutoSizeRelative(constraint.bottomAnchor, constraint.topAnchor);
            })
    
            // let autoSizeCount = 1
            // do {
            //     this.components.forEach(component => {
            //         let constraint = this.componentConstraints.get(component.props.id)
            //         let preferredSize = this.props.getPreferredSize(component)
            //         this.calculateAutoSize(constraint.topAnchor, constraint.bottomAnchor, preferredSize.getHeight(), autoSizeCount);
            //         this.calculateAutoSize(constraint.leftAnchor, constraint.rightAnchor, preferredSize.getWidth(), autoSizeCount);
            //     });
            //     autoSizeCount = Math.pow(2, 31) - 1
            //     this.components.forEach(component => {
            //         let constraint = this.componentConstraints.get(component.props.id)
            //         let count = this.finishAutoSizeCalculation(constraint.leftAnchor, constraint.rightAnchor)
            //         if(count > 0 && count < autoSizeCount) {
            //             autoSizeCount = count;
            //         }
            //         count = this.finishAutoSizeCalculation(constraint.rightAnchor, constraint.leftAnchor)
            //         if(count > 0 && count < autoSizeCount) {
            //             autoSizeCount = count;
            //         }
            //         count = this.finishAutoSizeCalculation(constraint.topAnchor, constraint.bottomAnchor)
            //         if(count > 0 && count < autoSizeCount) {
            //             autoSizeCount = count;
            //         }
            //         count = this.finishAutoSizeCalculation(constraint.bottomAnchor, constraint.topAnchor)
            //         if(count > 0 && count < autoSizeCount) {
            //             autoSizeCount = count;
            //         }
            //     })
            // } while (autoSizeCount > 0 && autoSizeCount < Math.pow(2, 31) - 1);

            for (let autoSizeCount = 1; autoSizeCount > 0 && autoSizeCount < Math.pow(2, 31) - 1;) {
                this.components.forEach(component => {
                    if (this.props.isVisible(component)) {
                        let constraint = this.componentConstraints.get(component.props.id)
                        let preferredSize;
                        if (this.compSizes.get(component.props.id) !== undefined) {
                            console.log('yo')
                            preferredSize = this.compSizes.get(component.props.id)
                        }
                        else {
                            preferredSize = getPreferredSize(component)
                        }
                        this.calculateAutoSize(constraint.topAnchor, constraint.bottomAnchor, preferredSize.height, autoSizeCount);
                        this.calculateAutoSize(constraint.leftAnchor, constraint.rightAnchor, preferredSize.width, autoSizeCount);
                    }
                });
                autoSizeCount = Math.pow(2, 31) - 1
                this.components.forEach(component => {
                    if (this.props.isVisible(component)) {
                        let constraint = this.componentConstraints.get(component.props.id)
                        let count = this.finishAutoSizeCalculation(constraint.leftAnchor, constraint.rightAnchor)
                        if (count > 0 && count < autoSizeCount) {
                            autoSizeCount = count;
                        }
                        count = this.finishAutoSizeCalculation(constraint.rightAnchor, constraint.leftAnchor)
                        if (count > 0 && count < autoSizeCount) {
                            autoSizeCount = count;
                        }
                        count = this.finishAutoSizeCalculation(constraint.topAnchor, constraint.bottomAnchor)
                        if (count > 0 && count < autoSizeCount) {
                            autoSizeCount = count;
                        }
                        count = this.finishAutoSizeCalculation(constraint.bottomAnchor, constraint.topAnchor)
                        if (count > 0 && count < autoSizeCount) {
                            autoSizeCount = count;
                        }
                    }
                })
            }
    
            this.leftBorderUsed = false;
            this.rightBorderUsed = false;
            this.topBorderUsed = false;
            this.bottomBorderUsed = false;
            
            let leftWidth = 0;
            let rightWidth = 0;
            let topHeight = 0;
            let bottomHeight = 0;
    
            this.components.forEach(component => {
                if (this.props.isVisible(component)) {
                    let constraint = this.componentConstraints.get(component.props.id);
                    let preferredSize;
                    if (this.compSizes.get(component.props.id) !== undefined) {
                        preferredSize = this.compSizes.get(component.props.id)
                    }
                    else {
                        preferredSize = getPreferredSize(component)
                    }
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
                        let w = constraint.leftAnchor.getAbsolutePosition() - constraint.rightAnchor.getAbsolutePosition() + preferredSize.width;
                        //console.log(w, preferredSize.width, component, constraint.leftAnchor.getAbsolutePosition(), constraint.rightAnchor.getAbsolutePosition())
                        if (w > this.preferredWidth) {
                            this.preferredWidth = w;
                        }
                        w = constraint.leftAnchor.getAbsolutePosition() - constraint.rightAnchor.getAbsolutePosition() + minimumSize.width;
                        if (w > this.minimumWidth) {
                            this.minimumWidth = w;
                        }
                        this.leftBorderUsed = true;
                        this.rightBorderUsed = true;
                    }
                    if (constraint.topAnchor.getBorderAnchor() === this.topBorderAnchor && constraint.bottomAnchor.getBorderAnchor() === this.bottomBorderAnchor) {
                        let h = constraint.topAnchor.getAbsolutePosition() - constraint.bottomAnchor.getAbsolutePosition() + preferredSize.height;
                        if (h > this.preferredHeight) {
                            this.preferredHeight = h;
                        }
                        h = constraint.topAnchor.getAbsolutePosition() - constraint.bottomAnchor.getAbsolutePosition() + minimumSize.height;
                        if (h > this.minimumHeight) {
                            this.minimumHeight = h;
                        }
                        this.topBorderUsed = true;
                        this.bottomBorderUsed = true;
                    }
                }
            });
            if (leftWidth !== 0 && rightWidth !== 0) {
                let w = leftWidth + rightWidth + this.props.gaps.horizontalGap;
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
                let h = topHeight + bottomHeight + this.props.gaps.verticalGap;
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
    
            let margins = this.props.margins;
    
            this.preferredWidth -= margins.marginLeft + margins.marginRight;
            this.preferredHeight -= margins.marginTop + margins.marginBottom;
    
            this.minimumWidth -= margins.marginLeft + margins.marginRight;
            this.minimumHeight -= margins.marginTop + margins.marginBottom;

            //console.log(this.props.component.props.id, this.preferredHeight, this.preferredWidth);
    
            this.vCalculateTargetDependentAnchors = true;
            this.valid = true;
        }
    }

    calculateTargetDependentAnchors() {
        if (this.vCalculateTargetDependentAnchors) {
            let size;
            if (this.compSizes.get(this.props.component.props.id) !== undefined) {
                size = this.compSizes.get(this.props.component.props.id)
            }
            else {
                size = getPreferredSize(this.props.component)
            }
            let minSize = this.minimumLayoutSize();
            let maxSize = this.maximumLayoutSize();

            if (this.horizontalAlignment === 'stretch' || (this.leftBorderUsed && this.rightBorderUsed)) {
                if (minSize.width > size.width) {
                    this.leftBorderAnchor.position = 0;
                    this.rightBorderAnchor.position = minSize.width;
                }
                else if (maxSize.width < size.width) {
                    switch (this.horizontalAlignment) {
                        case 'left':
                            this.leftBorderAnchor.position = 0;
                            break;
                        case 'right':
                            this.leftBorderAnchor.position = size.width - maxSize.width;
                            break;
                        default:
                            this.leftBorderAnchor.position = (size.width - maxSize.width) / 2;
                    }
                    this.rightBorderAnchor.position = this.leftBorderAnchor.position + maxSize.width;
                }
                else {
                    this.leftBorderAnchor.position = 0;
                    this.rightBorderAnchor.position = size.width;
                }
            }
            else {
                if (this.preferredWidth > size.width) {
                    this.leftBorderAnchor.position = 0;
                }
                else {
                    switch (this.horizontalAlignment) {
                        case 'left':
                            this.leftBorderAnchor.position = 0;
                            break;
                        case 'right':
                            this.leftBorderAnchor.position = size.width - this.preferredWidth;
                            break;
                        default:
                            this.leftBorderAnchor.position = (size.width - this.preferredWidth) / 2;
                    }
                }
                this.rightBorderAnchor.position = this.leftBorderAnchor.position + this.preferredWidth
            }
            if (this.verticalAlignment === 'stretch' || (this.topBorderUsed && this.bottomBorderUsed)) {
                if (minSize.height > size.height) {
                    this.topBorderAnchor.position = 0;
                    this.bottomBorderAnchor.position = minSize.height;
                }
                else if (maxSize.height < size.height) {
                    switch (this.verticalAlignment) {
                        case 'top':
                            this.topBorderAnchor.position = 0;
                            break;
                        case 'bottom':
                            this.topBorderAnchor.position = size.height - maxSize.height;
                            break;
                        default:
                            this.topBorderAnchor.position = (size.height - maxSize.height) / 2;
                    }
                    this.bottomBorderAnchor.position = this.topBorderAnchor.position + maxSize.height;
                }
                else {
                    this.topBorderAnchor.position = 0;
                    this.bottomBorderAnchor.position = size.height;
                }
            }
            else {
                if (this.preferredHeight > size.height) {
                    this.topBorderAnchor.position = 0;
                }
                else {
                    switch (this.verticalAlignment) {
                        case 'top':
                            this.topBorderAnchor.position = 0;
                            break;
                        case 'bottom':
                            this.topBorderAnchor.position = size.height - this.preferredHeight;
                            break;
                        default:
                            this.topBorderAnchor.position = (size.height - this.preferredHeight) / 2;
                    }
                }
                this.bottomBorderAnchor.position = this.topBorderAnchor.position + this.preferredHeight;
            }
            
            this.leftBorderAnchor.position -= this.props.margins.marginLeft;
            this.rightBorderAnchor.position -= this.props.margins.marginLeft;
            this.topBorderAnchor.position -= this.props.margins.marginTop;
            this.bottomBorderAnchor.position -= this.props.margins.marginTop;

            this.components.forEach(component => {
                if (this.props.isVisible(component)) {
                    let constraint = this.componentConstraints.get(component.props.id);
                    let preferredSize;
                    if (this.compSizes.get(component.props.id) !== undefined) {
                        console.log('relative')
                        preferredSize = this.compSizes.get(component.props.id)
                    }
                    else {
                        preferredSize = getPreferredSize(component)
                    }
                    console.log(preferredSize)
                    this.calculateRelativeAnchor(constraint.leftAnchor, constraint.rightAnchor, preferredSize.width);
                    this.calculateRelativeAnchor(constraint.topAnchor, constraint.bottomAnchor, preferredSize.height);
                }
            });
            this.vCalculateTargetDependentAnchors = false;
        }
    }

    buildComponents(components) {
        let tempContent = [];
        components.forEach(component => {
            if (this.props.isVisible(component)) {
                let constraint = this.componentConstraints.get(component.props.id);
                console.log(constraint.topAnchor.getBorderAnchor())
                console.log(constraint.leftAnchor, constraint.leftAnchor.getBorderAnchor())
                let compHeight = constraint.bottomAnchor.getAbsolutePosition() - constraint.topAnchor.getAbsolutePosition();
                let compWidth = constraint.rightAnchor.getAbsolutePosition() - constraint.leftAnchor.getAbsolutePosition();
                if(component.props.className === "GroupPanel" || component.props.className === "Panel") {
                    if (compHeight > this.preferredHeight) {
                        compHeight = this.preferredHeight;
                    }
                    if (compWidth > this.preferredWidth) {
                        compWidth = this.preferredWidth;
                    }
                }
                let style = {
                        position: 'absolute',
                        height: compHeight,
                        width: compWidth,
                        left: constraint.leftAnchor.getAbsolutePosition(),
                        top: constraint.topAnchor.getAbsolutePosition()
                    }
                let clonedComponent = React.cloneElement(component, {layoutStyle: style})
                tempContent.push(clonedComponent);     
            }
        });
        this.setState({content: tempContent})
    }

    layoutContainer() {
        this.currentPanelData = this.context.contentStore.flatContent.find(component => component.id === this.props.component.props.id);
        this.valid = false;
        this.calculateAnchors()
        this.calculateTargetDependentAnchors()
        this.buildComponents(this.components)
        this.finishSizesAndPos()
    }

    finishSizesAndPos() {
        let el = document.getElementById(this.props.component.props.id)
        if (el !== null) {
            if (!this.firstPosCalc) {
                this.prevTop = el.style.top
                this.firstPosCalc = true;
            }
            if (FindReact(document.getElementById(this.props.component.props.id)).props.constraints !== 'Center') {
                el.style.height = toPx((this.preferredHeight + this.props.margins.marginTop + this.props.margins.marginBottom));
                el.style.width = toPx((this.preferredWidth + this.props.margins.marginLeft + this.props.margins.marginRight));
                if (el.previousSibling !== null) {
                    el.style.top = toPx((parseInt(this.prevTop) + parseInt(el.previousSibling.style.height) + parseInt(el.previousSibling.style.top)))
                }
            }
        }
    }

    render() {
        let formHeight;
        if (FindReact(document.getElementById(this.props.component.props.id)).props.constraints === 'Center') {
            formHeight = 'calc(100% - ' + toPx((parseInt(this.props.margins.marginTop) + parseInt(this.props.margins.marginBottom))) + ')'
        }
        else {
            formHeight = this.preferredHeight
        }
        return (
            <div className={"formlayout " + this.props.component.props.id} style={{
                                        position: 'relative',
                                        width: this.preferredWidth, 
                                        height: formHeight,
                                        marginTop: this.props.margins.marginTop,
                                        marginLeft: this.props.margins.marginLeft,
                                        marginBottom: this.props.margins.marginBottom,
                                        marginRight: this.props.margins.marginRight
                                        }}>{this.state.content}</div>
        )
    }
}
FormLayout.contextType = RefContext
export default FormLayout;


