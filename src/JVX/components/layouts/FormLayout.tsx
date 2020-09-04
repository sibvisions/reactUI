import React, {Children, FC, useContext, useLayoutEffect, useRef, useState} from "react";
import {layout} from "./Layout";
import Anchor from "./models/Anchor";
import Constraints from "./models/Constraints";
import Gaps from "./models/Gaps";
import Margins from "./models/Margins";
import {HORIZONTAL_ALIGNMENT, VERTICAL_ALIGNMENT} from "./models/ALIGNMENT";
import {jvxContext} from "../../jvxProvider";
import {layoutInfo} from "../../EventStream";

type childWithProps = {
    props: {
        id: string,
        constraints: string
        isVisible: boolean | undefined
    }
}

type selfStyle = {
    height: number,
    width: number,
    top: number,
    left: number,
    marginTop: number,
    marginBottom: number,
    marginRight: number,
    marginLeft: number
}



const FormLayout: FC<layout> = (props) => {

    const [style, changeStyle] = useState<selfStyle>();
    const layoutDiv = useRef<HTMLDivElement>(null);
    const context = useContext(jvxContext)

    useLayoutEffect(()=> {
        if(props.preferredSizes && !style){
            setAnchorsAndConstraints();
            calculateAnchors();
            calculateTargetDependentAnchors();
            buildComponents();
        }
    });

    const anchors = new Map<string, Anchor>();
    const componentConstraints = new Map<string, Constraints>();

    const margins = new Margins(props.layout.substring(props.layout.indexOf(',') + 1, props.layout.length).split(',').slice(0, 4))
    const gaps = new Gaps(props.layout.substring(props.layout.indexOf(',') + 1, props.layout.length).split(',').slice(4, 6));
    const alignments = props.layout.substring(props.layout.indexOf(',') + 1, props.layout.length).split(',').slice(6, 8);
    const horizontalAlignment =  parseInt(alignments[0]);
    const verticalAlignment = parseInt(alignments[1]);

    let leftBorderUsed = false;
    let rightBorderUsed = false;
    let topBorderUsed = false;
    let bottomBorderUsed = false;

    let preferredWidth: number = 0;
    let preferredHeight: number = 0;
    let minimumHeight: number = 0;
    let minimumWidth: number = 0;

    let calculatedTargetDependentAnchors = false;

    const setAnchorsAndConstraints = () => {
        anchors.clear(); componentConstraints.clear();
        //Parse Layout info and set Anchors
        const splitAnchors = props.layoutData.split(";");
        splitAnchors.forEach(anchorData => {
            const name = anchorData.substring(0, anchorData.indexOf(","));
            anchors.set(name, new Anchor(anchorData));
        });
        //Establish related Anchors
        anchors.forEach(value => {
            value.relatedAnchor = anchors.get(value.relatedAnchorName);
        });
        //Build Constraints of Children
        Children.map(props.children, child => {
            const childWithProps = (child as childWithProps);
            const anchorNames = childWithProps.props.constraints.split(";");
            //Get Anchors
            const topAnchor = anchors.get(anchorNames[0]); const leftAnchor = anchors.get(anchorNames[1]);
            const bottomAnchor = anchors.get(anchorNames[2]); const rightAnchor = anchors.get(anchorNames[3]);
            //Set Constraint
            if(topAnchor && leftAnchor && rightAnchor && bottomAnchor){
                const constraint: Constraints = new Constraints(topAnchor, leftAnchor, bottomAnchor, rightAnchor);
                componentConstraints.set(childWithProps.props.id, constraint);
            } else {
                console.warn("Constraint Anchors were undefined");
            }
        });
    }

    const calculateAnchors = () =>  {

        const getAutoSizeAnchorsBetween = (startAnchor: Anchor, endAnchor: Anchor): Array<Anchor> => {
            const autoSizeAnchors = Array<Anchor>();
            let startAnchorIntern : Anchor | undefined = startAnchor
            while (startAnchorIntern && startAnchorIntern !== endAnchor){
                if(startAnchorIntern.autoSize && !startAnchorIntern.autoSizeCalculated){
                    autoSizeAnchors.push(startAnchorIntern);
                }
                startAnchorIntern = startAnchorIntern.relatedAnchor;
            }
            //If the anchors are not dependent on each other return an empty array!!
            if(!startAnchorIntern){
                autoSizeAnchors.length = 0;
            }
            return autoSizeAnchors;
        }

        const initAutoSizeRelative = (startAnchor: Anchor, endAnchor: Anchor) => {
            const autosizeAnchors = getAutoSizeAnchorsBetween(startAnchor, endAnchor);
            autosizeAnchors.forEach(value => {
                value.relative = false;
            });
        }

        const calculateAutoSize = (leftTopAnchor: Anchor, rightBottomAnchor: Anchor, preferredSize: number | undefined, autoSizeCount: number) => {
            let autoSizeAnchors = getAutoSizeAnchorsBetween(leftTopAnchor, rightBottomAnchor);
            if(autoSizeAnchors.length === autoSizeCount && preferredSize){
                let fixedSize = rightBottomAnchor.getAbsolutePosition() - leftTopAnchor.getAbsolutePosition();
                autoSizeAnchors.forEach(anchor => {
                    fixedSize += anchor.position;
                });
                const diffSize = (preferredSize - fixedSize + autoSizeCount - 1) / autoSizeCount
                autoSizeAnchors.forEach(anchor => {
                    if(diffSize > -anchor.position){
                        anchor.position = -diffSize;
                    }
                    anchor.firstCalculation = false;
                });
            }

            autoSizeAnchors = getAutoSizeAnchorsBetween(rightBottomAnchor, leftTopAnchor);
            if(autoSizeAnchors.length === autoSizeCount && preferredSize){
                let fixedSize = rightBottomAnchor.getAbsolutePosition() - leftTopAnchor.getAbsolutePosition();
                autoSizeAnchors.forEach(anchor => {
                    fixedSize -= anchor.position;
                });
                const diffSize = (preferredSize - fixedSize + autoSizeCount -1) / autoSizeCount;
                autoSizeAnchors.forEach(anchor => {

                    if(diffSize > anchor.position){
                        anchor.position = diffSize;
                    }
                    anchor.firstCalculation = false;
                });
            }
        }

        const finishAutoSizeCalculation = (leftTopAnchor: Anchor, rightBottomAnchor: Anchor): number => {
            const autoSizeAnchors = getAutoSizeAnchorsBetween(leftTopAnchor, rightBottomAnchor);
            let counter = 0;
            autoSizeAnchors.forEach(anchor => {
                if(!anchor.firstCalculation){
                    anchor.autoSizeCalculated = true;
                    counter++;
                }
            });
            return autoSizeAnchors.length - counter
        }

        const clearAutoSize = () => {
            anchors.forEach(anchor => {
                anchor.relative = anchor.autoSize;
                anchor.autoSizeCalculated = false;
                anchor.firstCalculation = true;
                if(anchor.autoSize){
                    anchor.position = 0;
                }
            })
        }

        clearAutoSize();

        //Init autosize Anchor position
        anchors.forEach(anchor => {
            if(anchor.relatedAnchor && anchor.relatedAnchor.autoSize){
                const relatedAutoSizeAnchor = anchor.relatedAnchor;
                if(relatedAutoSizeAnchor.relatedAnchor && !relatedAutoSizeAnchor.relatedAnchor.autoSize){
                    relatedAutoSizeAnchor.position= -anchor.position;
                }
            }
        });

        //Init autosize Anchors
        Children.map(props.children, child => {
            const childWithProps = (child as childWithProps);
            const constraint = componentConstraints.get(childWithProps.props.id);
            if(constraint && constraint.rightAnchor && constraint.leftAnchor && constraint.bottomAnchor && constraint.topAnchor){
                initAutoSizeRelative(constraint.leftAnchor, constraint.rightAnchor);
                initAutoSizeRelative(constraint.rightAnchor, constraint.leftAnchor);
                initAutoSizeRelative(constraint.topAnchor, constraint.bottomAnchor);
                initAutoSizeRelative(constraint.bottomAnchor, constraint.topAnchor);
            }
        });

        //AutoSize calculations
        for(let autoSizeCount = 1; autoSizeCount > 0 && autoSizeCount < 100000;){
            //CalculateAutoSize
            Children.map(props.children, child => {
                const childWithProps = (child as childWithProps);
                if(childWithProps.props.isVisible){
                    const constraint: Constraints | undefined = componentConstraints.get(childWithProps.props.id);
                    if(constraint && props.preferredSizes){
                        const preferredSizeObj = props.preferredSizes.get(childWithProps.props.id);
                        if(preferredSizeObj){
                            calculateAutoSize(constraint.topAnchor, constraint.bottomAnchor, preferredSizeObj.height, autoSizeCount);
                            calculateAutoSize(constraint.leftAnchor, constraint.rightAnchor, preferredSizeObj.width, autoSizeCount);
                        }
                    }
                }
            });
            autoSizeCount = 100000;
            //Finish AutoSize
            Children.map(props.children, child => {
                const childWithProps = (child as childWithProps);
                const constraints = componentConstraints.get(childWithProps.props.id)
                if(constraints){
                    let count: number
                    count = finishAutoSizeCalculation(constraints.leftAnchor, constraints.rightAnchor);
                    if(count > 0 && count < autoSizeCount){
                        autoSizeCount = count;
                    }
                    count = finishAutoSizeCalculation(constraints.rightAnchor, constraints.leftAnchor);
                    if(count > 0 && count < autoSizeCount){
                        autoSizeCount = count;
                    }
                    count = finishAutoSizeCalculation(constraints.topAnchor, constraints.bottomAnchor);
                    if(count > 0 && count < autoSizeCount){
                        autoSizeCount = count;
                    }
                    count = finishAutoSizeCalculation(constraints.bottomAnchor, constraints.topAnchor);
                    if(count > 0 && count < autoSizeCount){
                        autoSizeCount = count;
                    }
                }
            });
        }

        let leftWidth = 0;
        let rightWidth = 0;
        let topHeight = 0;
        let bottomHeight = 0;

        //Anchor Positions of Children
        Children.map(props.children, child => {
            const childWithProps = (child as childWithProps);
            if(childWithProps.props.isVisible && props.preferredSizes){
                const constraint = componentConstraints.get(childWithProps.props.id);
                const preferredSize = props.preferredSizes.get(childWithProps.props.id);
                if(constraint && preferredSize){
                    if(constraint.rightAnchor.getBorderAnchor().name === "l"){
                        let w = constraint.rightAnchor.getAbsolutePosition();
                        if(w > leftWidth){
                            leftWidth = w;
                        }
                        leftBorderUsed = true;
                    }
                    if(constraint.leftAnchor.getBorderAnchor().name === "r"){
                        let w = constraint.leftAnchor.getAbsolutePosition();
                        if(w > rightWidth){
                            rightWidth = w;
                        }
                        rightBorderUsed = true;
                    }
                    if(constraint.bottomAnchor.getBorderAnchor().name === "t"){
                        let h = constraint.bottomAnchor.getAbsolutePosition();
                        if(h > topHeight){
                            topHeight = h;
                        }
                        topBorderUsed = true;
                    }
                    if(constraint.topAnchor.getBorderAnchor().name === "b"){
                        let h = constraint.topAnchor.getAbsolutePosition();
                        if(h > bottomHeight){
                            bottomHeight = h;
                        }
                        bottomBorderUsed = true;
                    }
                    if(constraint.leftAnchor.getBorderAnchor().name === "l" && constraint.rightAnchor.getBorderAnchor().name === "r"){
                        let w = constraint.leftAnchor.getAbsolutePosition() - constraint.rightAnchor.getAbsolutePosition() + preferredSize.width;
                        if(w > preferredWidth){
                            preferredWidth = w;
                        }
                        if(w > minimumWidth){
                            minimumWidth = w;
                        }
                        leftBorderUsed = true;
                        rightBorderUsed = true;
                    }
                    if(constraint.topAnchor.getBorderAnchor().name === "t" && constraint.bottomAnchor.getBorderAnchor().name === "b"){
                        let h = constraint.topAnchor.getAbsolutePosition() - constraint.bottomAnchor.getAbsolutePosition() + preferredSize.height;
                        if(h > preferredHeight){
                            preferredHeight = h;
                        }
                        if(h > minimumHeight){
                            minimumHeight = h;
                        }
                        topBorderUsed = true;
                        bottomBorderUsed = true;
                    }
                }
            }
        });

        //Preferred Width
        if(leftWidth !== 0 && rightWidth !== 0){
            let w = leftWidth + rightWidth + gaps.horizontalGap;
            if(w > preferredWidth){
                preferredWidth = w;
            }
            if(w > minimumWidth){
                minimumWidth = w;
            }
        }
        else if(leftWidth !== 0){
            const rma = anchors.get("rm");
            if(rma){
                let w = leftWidth - rma.position;
                if(w > preferredWidth){
                    preferredWidth = w;
                }
                if(w > minimumWidth){
                    minimumWidth = w;
                }
            }
        }
        else {
            const lma = anchors.get("lm");
            if(lma){
                let w = rightWidth + lma.position;
                if(w > preferredWidth){
                    preferredWidth = w;
                }
                if(w > minimumWidth){
                    minimumWidth = w;
                }
            }
        }

        //Preferred Height
        if(topHeight !== 0 && bottomHeight !== 0){
            let h = topHeight + bottomHeight + gaps.vertical;
            if(h > preferredHeight){
                preferredHeight = h;
            }
            if(h > minimumHeight){
                minimumHeight = h;
            }
        }
        else if(topHeight !== 0 ){
            const bma = anchors.get("bm");
            if(bma){
                let h = topHeight - bma.position;
                if(h > preferredHeight){
                    preferredHeight = h;
                }
                if(h > minimumHeight){
                    minimumHeight = h;
                }
            }
        }
        else {
            const tma = anchors.get("tm");
            if(tma){
                let h = bottomHeight + tma.position;
                if(h > preferredHeight){
                    preferredHeight = h;
                }
                if(h > minimumHeight){
                    minimumHeight = h;
                }
            }
        }


        preferredWidth -= margins.marginLeft + margins.marginRight;
        preferredHeight -= margins.marginTop + margins.marginBottom;

        minimumWidth -= margins.marginLeft + margins.marginLeft;
        minimumHeight -= margins.marginTop + margins.marginBottom;

        calculatedTargetDependentAnchors = true
    }

    const calculateTargetDependentAnchors = () => {
        const calculateRelativeAnchor = (leftTopAnchor: Anchor, rightBottomAnchor: Anchor, preferredSize: number) => {
        }

        //Set from Server
        const maxLayoutSize: {width: number, height: number} = {height:100000, width:100000};
        const minLayoutSize: {width: number, height: number} = {width: 10, height: 10};
        //Div Size
        let availableSize: {width: number, height: number} | undefined = undefined;
        if(layoutDiv.current){
            const size = layoutDiv.current.getClientRects().item(0);
            if(size) {
                availableSize = {width: size.width, height: size.height};
            }
        }
        const lba = anchors.get("l");
        const rba = anchors.get("r");
        const bba = anchors.get("b");
        const tba = anchors.get("t");
        if(calculatedTargetDependentAnchors && props.preferredSizes && lba && rba && bba && tba && availableSize){
            if(horizontalAlignment === HORIZONTAL_ALIGNMENT.STRETCH || (leftBorderUsed && rightBorderUsed)){
                if(minLayoutSize.width > availableSize.width){
                    lba.position = 0;
                    rba.position = minLayoutSize.width;
                }
                else if(maxLayoutSize.width < preferredWidth) {
                    switch (horizontalAlignment) {
                        case HORIZONTAL_ALIGNMENT.LEFT:
                            lba.position = 0;
                            break;
                        case HORIZONTAL_ALIGNMENT.RIGHT:
                            lba.position = availableSize.width - maxLayoutSize.width;
                            break;
                        default:
                            lba.position = (availableSize.width - maxLayoutSize.width) / 2;
                    }
                    rba.position = lba.position + maxLayoutSize.width;
                }
                else {
                    lba.position = 0;
                    rba.position = availableSize.width;
                }
            }
            else {
                if(preferredWidth > availableSize.width){
                    lba.position = 0;
                }
                else {
                    switch (horizontalAlignment){
                        case HORIZONTAL_ALIGNMENT.LEFT:
                            lba.position = 0;
                            break
                        case HORIZONTAL_ALIGNMENT.RIGHT:
                            lba.position = availableSize.width - preferredWidth
                            break;
                        default:
                            lba.position = (availableSize.width - preferredWidth) / 2
                    }
                }
                rba.position = lba.position + preferredWidth;
            }
            if(verticalAlignment === VERTICAL_ALIGNMENT.STRETCH || (topBorderUsed && bottomBorderUsed)){
                if(minLayoutSize.height > availableSize.height){
                    tba.position = 0;
                    bba.position = minLayoutSize.height;
                }
                else if(maxLayoutSize.height < availableSize.height){
                    switch (verticalAlignment){
                        case VERTICAL_ALIGNMENT.TOP:
                            tba.position = 0;
                            break;
                        case VERTICAL_ALIGNMENT.BOTTOM:
                            tba.position = availableSize.height - maxLayoutSize.height;
                            break;
                        default:
                            tba.position = (availableSize.height - maxLayoutSize.height) / 2;
                    }
                    bba.position = tba.position + maxLayoutSize.height;
                }
                else{
                    tba.position = 0;
                    bba.position = availableSize.height;
                }
            }
            else {
                if(preferredHeight > availableSize.height){
                    tba.position = 0;
                }
                else {
                    switch (verticalAlignment){
                        case VERTICAL_ALIGNMENT.TOP:
                            tba.position = 0;
                            break;
                        case VERTICAL_ALIGNMENT.BOTTOM:
                            tba.position = availableSize.height - preferredHeight;
                            break;
                        default:
                            tba.position = (availableSize.height - preferredHeight) / 2;
                    }
                }
                bba.position = tba.position + preferredHeight;
            }
            lba.position -= margins.marginLeft;
            rba.position -= margins.marginLeft;
            tba.position -= margins.marginTop;
            bba.position -= margins.marginTop;

            Children.map(props.children, child => {
                const childWithProps = (child as childWithProps);
                if(childWithProps.props.isVisible && props.preferredSizes){
                    const constraint = componentConstraints.get(childWithProps.props.id);
                    const preferredSize = props.preferredSizes.get(childWithProps.props.id);
                    if(constraint && preferredSize){
                        calculateRelativeAnchor(constraint.leftAnchor, constraint.rightAnchor, preferredSize.width);
                        calculateRelativeAnchor(constraint.topAnchor, constraint.bottomAnchor, preferredSize.height);
                    }

                }
            });
            calculatedTargetDependentAnchors = false;
        }

    }

    const buildComponents = () => {
        //Get Border- and Margin Anchors for calculation
        const lba = anchors.get("l");
        const rba = anchors.get("r");
        const tba = anchors.get("t");
        const bba = anchors.get("b");

        const tma = anchors.get("tm");
        const bma = anchors.get("bm");
        const lma = anchors.get("lm");
        const rma = anchors.get("rm");

        let marginConstraint: Constraints | undefined
        let borderConstraint: Constraints | undefined;

        if(tma && bma && rma && lma){
            marginConstraint = new Constraints(tma, lma, bma, rma);
        }

        if(lba && rba && tba && bba){
            borderConstraint = new Constraints(tba, lba, bba, rba);
        }

        Children.map(props.children, child => {
            const childWithProps = (child as childWithProps);
            const constraint = componentConstraints.get(childWithProps.props.id);

            if(constraint && marginConstraint && borderConstraint) {
                const left = constraint.leftAnchor.getAbsolutePosition() - marginConstraint.leftAnchor.getAbsolutePosition();
                const top = constraint.topAnchor.getAbsolutePosition() - marginConstraint.topAnchor.getAbsolutePosition();
                const width = constraint.rightAnchor.getAbsolutePosition() - constraint.leftAnchor.getAbsolutePosition();
                const height = constraint.bottomAnchor.getAbsolutePosition() - constraint.topAnchor.getAbsolutePosition();

                const styleObj: layoutInfo = {
                    position: "absolute",
                    id: childWithProps.props.id,
                    height: height.toString()+"px",
                    left: left,
                    top: top,
                    width: width.toString()+"px"
                }
                context.eventStream.styleEvent.next(styleObj)
            }
        });
        if(borderConstraint && marginConstraint)
            changeStyle({
                height: preferredHeight,
                width: preferredWidth,
                left: marginConstraint.leftAnchor.getAbsolutePosition(),
                top: marginConstraint.topAnchor.getAbsolutePosition(),
                marginBottom: margins.marginBottom,
                marginLeft: margins.marginLeft,
                marginRight: margins.marginRight,
                marginTop: margins.marginTop
            });
    }

    return(
        <div ref={layoutDiv} style={{height: "100%"}}>
            <span style={{...style, position:"relative", display:"inline-block"}}>
                {props.children}
            </span>
        </div>
    )
}
export default FormLayout