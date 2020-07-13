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
        this.updateFromState()
        this.calculateAutoSize(this.anchors.get("l"), this.anchors.get("lm"))
    }

    getAnchor(pAnchorData) {
        let name = pAnchorData.substring(0, pAnchorData.indexOf(','));
        if (name === '-') {
            return null;
        }
        let anchor = this.anchors.get(name)
        if (anchor === undefined) {
            anchor = new Anchor(pAnchorData, undefined, undefined, undefined, this)
            this.anchors.set(name, anchor)
        }
        else {
            anchor.setAnchorData(pAnchorData)
        }
        return anchor
    }

    updateFromState() {
        this.anchors.clear();

        this.anchors.set("t", this.borderAnchors.topAnchor);
        this.anchors.set("l", this.borderAnchors.leftAnchor);
        this.anchors.set("b", this.borderAnchors.bottomAnchor);
        this.anchors.set("r", this.borderAnchors.rightAnchor);
        this.anchors.set("tm", this.marginAnchors.topAnchor);
        this.anchors.set("lm", this.marginAnchors.leftAnchor);
        this.anchors.set("bm", this.marginAnchors.bottomAnchor);
        this.anchors.set("rm", this.marginAnchors.rightAnchor);

        var splittedRawAnchors = this.props.layoutData.split(';');
        splittedRawAnchors.forEach(anchorData => {
            this.getAnchor(anchorData)
        });
        this.props.childComponents.forEach(childComponent => {
            let constraints = new Constraints(this, childComponent.elem.constraints);
            this.componentConstraints.set(childComponent, constraints);
        })

        for (var anchor of this.anchors.values()) {
            anchor.parseAnchorData();
        }
        console.log(this.anchors);
        console.log(this.componentConstraints);
    }

    calculateAnchors() {
        this.borderAnchors.topAnchor.position = 0;
        this.borderAnchors.leftAnchor.position = 0;
        this.borderAnchors.bottomAnchor.position = 0;
        this.borderAnchors.rightAnchor.position = 0;

        this.preferredWidth = 0;
        this.preferredHeight = 0;

        this.minimumWidth = 0;
        this.minimumHeight = 0;

        // clearAutoSizeAnchors();
        // initAutoSizeAnchors();
        // calculateAutoSizeAnchors();
        // calculateSizes();
    }

    calculateAutoSize(pLeftTopAnchor, pRightBottomAnchor, pPreferredSize, pAutoSizeCount) {
        let anchors = this.getAutoSizeAnchorsBetween(pLeftTopAnchor, pRightBottomAnchor)
        let size = anchors.length;

        if (size === pAutoSizeCount) {
            let fixedSize = pRightBottomAnchor.getAbsolutePosition() - pLeftTopAnchor.getAbsolutePosition();
            anchors.forEach(anchor => {
                fixedSize += anchor.position
            })
            console.log(fixedSize)
        }
    }

    getAutoSizeAnchorsBetween(pStartAnchor, pEndAnchor) {
        let autoSizeAnchors = [];
        let nextRelatedAnchor = pStartAnchor;
        while (nextRelatedAnchor !== null && nextRelatedAnchor !== pEndAnchor) {
            if (nextRelatedAnchor.autoSize && !nextRelatedAnchor.autoSizeCalculated) {
                autoSizeAnchors.push(nextRelatedAnchor);
            }
            nextRelatedAnchor = nextRelatedAnchor.relatedAnchor;
        }

        if (nextRelatedAnchor === undefined) {
            autoSizeAnchors = [];
        }

        return autoSizeAnchors;
    }

    calculateAutoSizeAnchors(pAutoSizeCount) {
        this.props.childComponents.forEach(childComponent => {
            //let preferredSize;
            let constraint = this.componentConstraints.get(childComponent);
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

        this.props.childComponents.forEach(childComponent => {
            let constraint = this.componentConstraints.get(childComponent)
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
            <div>yo</div>
        )
    }
}
export default FormLayout;


