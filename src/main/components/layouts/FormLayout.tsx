/** React imports */
import React, { CSSProperties, FC, useCallback, useContext, useEffect, useRef, useState } from "react";

/** Other imports */
import { appContext } from "../../AppProvider";
import { LayoutContext } from "../../LayoutContext";
import { Anchor, Constraints, Gaps, Margins, HORIZONTAL_ALIGNMENT, VERTICAL_ALIGNMENT, ILayout } from ".";
import { ComponentSizes } from "../zhooks";
import BaseComponent from "../BaseComponent";
import { Dimension, parseMinSize } from "../util";

/**
 * The FormLayout is a simple to use Layout which allows complex forms.
 * Calculations are taken from "JVxFormLayout"
 * @param baseProps - the properties sent by the Layout component
 */
const FormLayout: FC<ILayout> = (baseProps) => {

    /** Current state of the calculatedStyle by the FormLayout */
    const [calculatedStyle, setCalculatedStyle] = useState<{ style?: CSSProperties, componentSizes?: Map<string, CSSProperties> }>();
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext)

    /** Extract variables from baseprops */
    const {
        components,
        layout,
        layoutData,
        compSizes,
        style,
        id,
        reportSize,
        maximumSize
    } = baseProps;

    /** 
     * Function which lays out the container
     * @param compSizes - the preferredSizes of all Childcomponents
     * @param children - the Childcomponents of the layout
     * @param layout - contains data about the layout like gaps, alignments etc.
     * @param layoutData - contains data about the anchors and constraints
     * @param onLayoutCallback - callback used to report the layouts size
     * @param style - contains the style properties for size of the parent layout
     */
    const calculateLayout = useCallback((
        compSizes: Map<string, ComponentSizes>,
        children: Map<string, BaseComponent>,
        layout: string,
        layoutData: string,
        onLayoutCallback: Function | undefined,
        style: CSSProperties) => {
            /** Map for the Anchors of the layout, key is the Anchor-name and value is the Anchor */
            const anchors = new Map<string, Anchor>();
            /** 
             * Map for the Constraints of the Childcomponents, key is the id of the compoonent
             * value is the Constraint
             */
            const componentConstraints = new Map<string, Constraints>();
            /** Margins */
            const margins = new Margins(layout.substring(layout.indexOf(',') + 1, layout.length).split(',').slice(0, 4));
            /** Horizontal- and vertical Gap */
            const gaps = new Gaps(layout.substring(layout.indexOf(',') + 1, layout.length).split(',').slice(4, 6));
            /** Extracted alignments string */
            const alignments = layout.substring(layout.indexOf(',') + 1, layout.length).split(',').slice(6, 8);
            /** Horizontal alignment */
            const horizontalAlignment =  parseInt(alignments[0]);
            /** Vertical alignment */
            const verticalAlignment = parseInt(alignments[1]);

            /** True, if the left border is used by another anchor. */ 
            let leftBorderUsed = false;
            /** True, if the right border is used by another anchor. */ 
            let rightBorderUsed = false;
            /** True, if the top border is used by another anchor. */ 
            let topBorderUsed = false;
            /** True, if the bottom border is used by another anchor. */ 
            let bottomBorderUsed = false;
            /** The preferred width */
            let preferredWidth: number = 0;
            /** The preferred height */
            let preferredHeight: number = 0;
            /** The minimum height */
            let minimumHeight: number = 0;
            /** The minimum width */
            let minimumWidth: number = 0;

            /** True, if the target dependent anchors should be calculated again. */
            let calculatedTargetDependentAnchors = false;

            /** Fills the Anchors- and Constraints map */
            const setAnchorsAndConstraints = () => {
                anchors.clear(); componentConstraints.clear();
                /** Parse layout info and fill Anchors-Map */
                const splitAnchors: Array<string> = layoutData.split(";");
                splitAnchors.forEach(anchorData => {
                    const name = anchorData.substring(0, anchorData.indexOf(","));
                    anchors.set(name, new Anchor(anchorData));
                });
                /** Establish related Anchors */
                anchors.forEach(value => {
                    value.relatedAnchor = anchors.get(value.relatedAnchorName);
                });
                /** Build Constraints of Childcomponents and fill Constraints-Map */
                children.forEach(component => {
                    const anchorNames = component.constraints.split(";");
                    /** Get Anchors */
                    const topAnchor = anchors.get(anchorNames[0]); const leftAnchor = anchors.get(anchorNames[1]);
                    const bottomAnchor = anchors.get(anchorNames[2]); const rightAnchor = anchors.get(anchorNames[3]);
                    /** Fill Constraints-Map */
                    if(topAnchor && leftAnchor && rightAnchor && bottomAnchor){
                        const constraint: Constraints = new Constraints(topAnchor, leftAnchor, bottomAnchor, rightAnchor);
                        componentConstraints.set(component.id, constraint);
                    }
                });
            }

            /** Calculate all Autosize anchors */
            const calculateAnchors = () =>  {
                /**
                 * Gets all auto size anchors between start and end anchor
                 * @param startAnchor - start anchor
                 * @param endAnchor - end anchor
                 * @returns all auto size anchors between start and end anchor.
                 */
                const getAutoSizeAnchorsBetween = (startAnchor: Anchor, endAnchor: Anchor): Array<Anchor> => {
                    const autoSizeAnchors = Array<Anchor>();
                    let startAnchorIntern : Anchor | undefined = startAnchor
                    while (startAnchorIntern && startAnchorIntern !== endAnchor){
                        if(startAnchorIntern.autoSize && !startAnchorIntern.autoSizeCalculated){
                            autoSizeAnchors.push(startAnchorIntern);
                        }
                        startAnchorIntern = startAnchorIntern.relatedAnchor;
                    }

                    /** If the anchors are not dependent on each other return an empty array! */
                    if(!startAnchorIntern){
                        autoSizeAnchors.length = 0;
                    }
                    return autoSizeAnchors;
                }

                /**
                 * Init component auto size position of anchor.
                 * @param startAnchor - start anchor
                 * @param endAnchor - end anchor
                 */
                const initAutoSizeRelative = (startAnchor: Anchor, endAnchor: Anchor) => {
                    const autosizeAnchors = getAutoSizeAnchorsBetween(startAnchor, endAnchor);
                    autosizeAnchors.forEach(value => {
                        value.relative = false;
                    });
                }

                /**
                 * Calculates the preferred size of component auto size anchors.
                 * @param leftTopAnchor - the left or top anchor
                 * @param rightBottomAnchor - the right or bottom anchor
                 * @param preferredSize - the preferred size
                 * @param autoSizeCount - the amount of autoSizeCount
                 */
                const calculateAutoSize = (leftTopAnchor: Anchor, rightBottomAnchor: Anchor, preferredSize: number | undefined, autoSizeCount: number) => {
                    let autoSizeAnchors = getAutoSizeAnchorsBetween(leftTopAnchor, rightBottomAnchor);
                    if(autoSizeAnchors.length === autoSizeCount && preferredSize !== undefined){
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
                    if(autoSizeAnchors.length === autoSizeCount && preferredSize !== undefined){
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

                /**
                 * Marks all touched Autosize anchors as calculated
                 * @param leftTopAnchor - the left or top anchor
                 * @param rightBottomAnchor - the right or bottom anchor
                 * @returns amount of autosize anchors left
                 */
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

                /**
                 * clears auto size position of anchors
                 */
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

                /** Init autosize Anchor position */
                anchors.forEach(anchor => {
                    if(anchor.relatedAnchor && anchor.relatedAnchor.autoSize){
                        const relatedAutoSizeAnchor = anchor.relatedAnchor;
                        if(relatedAutoSizeAnchor.relatedAnchor && !relatedAutoSizeAnchor.relatedAnchor.autoSize){
                            relatedAutoSizeAnchor.position= -anchor.position;
                        }
                    }
                });

                /** Init autosize Anchors */
                children.forEach(component => {
                    const constraint = componentConstraints.get(component.id);
                    if(constraint && constraint.rightAnchor && constraint.leftAnchor && constraint.bottomAnchor && constraint.topAnchor){
                        initAutoSizeRelative(constraint.leftAnchor, constraint.rightAnchor);
                        initAutoSizeRelative(constraint.rightAnchor, constraint.leftAnchor);
                        initAutoSizeRelative(constraint.topAnchor, constraint.bottomAnchor);
                        initAutoSizeRelative(constraint.bottomAnchor, constraint.topAnchor);
                    }
                });

                /** AutoSize calculations */
                for(let autoSizeCount = 1; autoSizeCount > 0 && autoSizeCount < 100000;){
                    children.forEach(component => {
                        if(component.visible !== false){
                            const constraint = componentConstraints.get(component.id);
                            const preferredSizeObj = compSizes.get(component.id)?.preferredSize;
                            if(constraint && preferredSizeObj) {
                                calculateAutoSize(constraint.topAnchor, constraint.bottomAnchor, preferredSizeObj.height as number, autoSizeCount);
                                calculateAutoSize(constraint.leftAnchor, constraint.rightAnchor, preferredSizeObj.width as number, autoSizeCount);
                            }
                        }
                    });
                    autoSizeCount = 100000;

                    /** Finish AutoSize */
                    children.forEach(component => {
                        const constraints = componentConstraints.get(component.id)
                        if(constraints){
                            let count: number
                            /** 
                             * Finish AutoSize calculation for each constraint count is the autosize anchors left.
                             * Leaves loop when there are no unfinished autosize anchors left
                             */
                            count = finishAutoSizeCalculation(constraints.leftAnchor, constraints.rightAnchor);
                            if (count > 0 && count < autoSizeCount) {
                                autoSizeCount = count;
                            }
                            count = finishAutoSizeCalculation(constraints.rightAnchor, constraints.leftAnchor);
                            if (count > 0 && count < autoSizeCount) {
                                autoSizeCount = count;
                            }
                            count = finishAutoSizeCalculation(constraints.topAnchor, constraints.bottomAnchor);
                            if (count > 0 && count < autoSizeCount) {
                                autoSizeCount = count;
                            }
                            count = finishAutoSizeCalculation(constraints.bottomAnchor, constraints.topAnchor);
                            if (count > 0 && count < autoSizeCount) {
                                autoSizeCount = count;
                            }
                        }
                    });
                }
                let leftWidth = 0;
                let rightWidth = 0;
                let topHeight = 0;
                let bottomHeight = 0;

                const isPanel = (className: string | undefined) => {
                    if (className !== undefined) {
                        if (className === "Panel"
                            || className === "SplitPanel"
                            || className === "ScrollPanel"
                            || className === "GroupPanel"
                            || className === "TabsetPanel") {
                            return true;
                        }
                    }
                    return false;
                }

                /** Calculate preferredSize */
                children.forEach(component => {
                    if(component.visible !== false){
                        const constraint = componentConstraints.get(component.id);

                        const preferredComponentSize = compSizes.get(component.id)?.preferredSize;
                        const minimumComponentSize = component.minimumSize && parseMinSize(component.minimumSize) || (isPanel(component.className) ? 
                                                     compSizes.get(component.id)?.minimumSize
                                                     :
                                                     compSizes.get(component.id)?.preferredSize)
                                                     || { width: 0, height: 0 };

                        if(constraint && preferredComponentSize && minimumComponentSize){
                            if(constraint.rightAnchor.getBorderAnchor().name === "l"){
                                let w = constraint.rightAnchor.getAbsolutePosition();
                                if(w > leftWidth){
                                    leftWidth = w;
                                }
                                leftBorderUsed = true;
                            }
                            if(constraint.leftAnchor.getBorderAnchor().name === "r"){
                                let w = -constraint.leftAnchor.getAbsolutePosition();
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
                                let h = -constraint.topAnchor.getAbsolutePosition();
                                if(h > bottomHeight){
                                    bottomHeight = h;
                                }
                                bottomBorderUsed = true;
                            }
                            if(constraint.leftAnchor.getBorderAnchor().name === "l" && constraint.rightAnchor.getBorderAnchor().name === "r"){
                                if (!constraint.leftAnchor.autoSize || !constraint.rightAnchor.autoSize) {
                                    let w = constraint.leftAnchor.getAbsolutePosition() - constraint.rightAnchor.getAbsolutePosition() + preferredComponentSize.width;
                                    if(w > preferredWidth){
                                        preferredWidth = w;
                                    }
                                    w = constraint.leftAnchor.getAbsolutePosition() - constraint.rightAnchor.getAbsolutePosition() + minimumComponentSize.width
                                    if(w > minimumWidth){
                                        minimumWidth = w;
                                    }
                                }
                                leftBorderUsed = true;
                                rightBorderUsed = true;
                            }
                            if(constraint.topAnchor.getBorderAnchor().name === "t" && constraint.bottomAnchor.getBorderAnchor().name === "b"){
                                if (!constraint.topAnchor.autoSize || !constraint.bottomAnchor.autoSize) {
                                    let h = constraint.topAnchor.getAbsolutePosition() - constraint.bottomAnchor.getAbsolutePosition() + preferredComponentSize.height;
                                    if(h > preferredHeight){
                                        preferredHeight = h;
                                    }
                                    h = constraint.topAnchor.getAbsolutePosition() - constraint.bottomAnchor.getAbsolutePosition() + minimumComponentSize.height
                                    if(h > minimumHeight){
                                        minimumHeight = h;
                                    }
                                }
                                topBorderUsed = true;
                                bottomBorderUsed = true;
                            }
                        }
                    }
                });

                /** Preferred width */
                if(leftWidth !== 0 && rightWidth !== 0){
                    let w = leftWidth + rightWidth + gaps.horizontalGap;
                    if(w > preferredWidth) {
                        preferredWidth = w;
                    }
                    if(w > minimumWidth) {
                        minimumWidth = w;
                    }
                }
                else if (leftWidth !== 0) {
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

                /** Preferred height */
                if(topHeight !== 0 && bottomHeight !== 0){
                    let h = topHeight + bottomHeight + gaps.verticalGap;
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
                calculatedTargetDependentAnchors = true
            }

            /** Calculates all target size dependent anchors. This can only be done after the target has his correct size. */
            const calculateTargetDependentAnchors = () => {

                const getMinimumSize = (calcMinWidth:number, calcMinHeight:number):Dimension => {
                    if (baseProps.minimumSize) {
                        return baseProps.minimumSize;
                    }
                    return {width: calcMinWidth, height: calcMinHeight};
                }

                /**
                 * Calculates the preferred size of relative anchors.
                 * @param leftTopAnchor - left or top anchor
                 * @param rightBottomAnchor - right or bottom anchor
                 * @param preferredSize - the preferred size
                 */
                const calculateRelativeAnchor = (leftTopAnchor: Anchor, rightBottomAnchor: Anchor, preferredSize: number) => {

                    if(leftTopAnchor.relative){
                        const rightBottom = rightBottomAnchor.getRelativeAnchor();
                        if(rightBottom && rightBottom !== leftTopAnchor){
                            let pref = rightBottom.getAbsolutePosition() - rightBottomAnchor.getAbsolutePosition() + preferredSize;
                            let size = 0;
                            if(rightBottom.relatedAnchor && leftTopAnchor.relatedAnchor){
                                size = rightBottom.relatedAnchor.getAbsolutePosition() - leftTopAnchor.relatedAnchor.getAbsolutePosition();
                            }
                            let pos = pref - size;

                            if(pos < 0){
                                pos /= 2;
                            } else {
                                pos -= pos/2;
                            }

                            if(rightBottom.firstCalculation || pos > rightBottom.position){
                                rightBottom.firstCalculation = false;
                                rightBottom.position = pos;
                            }
                            pos = pref - size - pos;
                            if(leftTopAnchor.firstCalculation || pos > - leftTopAnchor){
                                leftTopAnchor.firstCalculation = false
                                leftTopAnchor.position = -pos;
                            }
                        }
                    }
                    else if(rightBottomAnchor.relative){
                        console.warn("not yet implemented")
                    }
                }

                /** Set from server */
                const maxLayoutSize: {width: number, height: number} = {height:100000, width:100000};
                const minLayoutSize: {width: number, height: number} = {width: 10, height: 10};

                /** Available size set by parent layout*/
                let calcSize = {width: (style?.width as number) || 0, height: (style?.height as number) || 0};

                const minSize = getMinimumSize(minimumWidth, minimumHeight);

                if(calcSize.width < minSize.width)
                    calcSize.width = minSize.width;
                if(calcSize.height < minSize.height)
                    calcSize.height = minSize.height;

                if(maximumSize) {
                    if(calcSize.width > maximumSize.width)
                        calcSize.width = maximumSize.width;
                    if(calcSize.height > maximumSize.height)
                        calcSize.height = maximumSize.height;
                }

                const lba = anchors.get("l");
                const rba = anchors.get("r");
                const bba = anchors.get("b");
                const tba = anchors.get("t");
                if(calculatedTargetDependentAnchors && lba && rba && bba && tba && calcSize){
                    if(horizontalAlignment === HORIZONTAL_ALIGNMENT.STRETCH || (leftBorderUsed && rightBorderUsed)){
                        if(minLayoutSize.width > calcSize.width){
                            lba.position = 0;
                            rba.position = minLayoutSize.width;
                        }
                        else if(maxLayoutSize.width < preferredWidth) {
                            switch (horizontalAlignment) {
                                case HORIZONTAL_ALIGNMENT.LEFT:
                                    lba.position = 0;
                                    break;
                                case HORIZONTAL_ALIGNMENT.RIGHT:
                                    lba.position = calcSize.width - maxLayoutSize.width;
                                    break;
                                default:
                                    lba.position = (calcSize.width - maxLayoutSize.width) / 2;
                            }
                            rba.position = lba.position + maxLayoutSize.width;
                        }
                        else {
                            lba.position = 0;
                            rba.position = calcSize.width;
                        }
                    }
                    else {
                        if(preferredWidth > calcSize.width){
                            lba.position = 0;
                        }
                        else {
                            switch (horizontalAlignment){
                                case HORIZONTAL_ALIGNMENT.LEFT:
                                    lba.position = 0;
                                    break
                                case HORIZONTAL_ALIGNMENT.RIGHT:
                                    lba.position = calcSize.width - preferredWidth
                                    break;
                                default:
                                    lba.position = (calcSize.width - preferredWidth) / 2
                            }
                        }
                        rba.position = lba.position + preferredWidth;
                    }
                    if(verticalAlignment === VERTICAL_ALIGNMENT.STRETCH || (topBorderUsed && bottomBorderUsed)){
                        if(minLayoutSize.height > calcSize.height){
                            tba.position = 0;
                            bba.position = minLayoutSize.height;
                        }
                        else if(maxLayoutSize.height < calcSize.height){
                            switch (verticalAlignment){
                                case VERTICAL_ALIGNMENT.TOP:
                                    tba.position = 0;
                                    break;
                                case VERTICAL_ALIGNMENT.BOTTOM:
                                    tba.position = calcSize.height - maxLayoutSize.height;
                                    break;
                                default:
                                    tba.position = (calcSize.height - maxLayoutSize.height) / 2;
                            }
                            bba.position = tba.position + maxLayoutSize.height;
                        }
                        else{
                            tba.position = 0;
                            bba.position = calcSize.height;
                        }
                    }
                    else {
                        if(preferredHeight > calcSize.height){
                            tba.position = 0;
                        }
                        else {
                            switch (verticalAlignment){
                                case VERTICAL_ALIGNMENT.TOP:
                                    tba.position = 0;
                                    break;
                                case VERTICAL_ALIGNMENT.BOTTOM:
                                    tba.position = calcSize.height - preferredHeight;
                                    break;
                                default:
                                    tba.position = (calcSize.height - preferredHeight) / 2;
                            }
                        }
                        bba.position = tba.position + preferredHeight;
                    }
                    lba.position -= margins.marginLeft;
                    rba.position -= margins.marginLeft;
                    tba.position -= margins.marginTop;
                    bba.position -= margins.marginTop;

                    children.forEach(component => {
                        if(component.visible !== false){
                            const constraint = componentConstraints.get(component.id);
                            const preferredComponentSize = compSizes.get(component.id)?.preferredSize;
                            if(constraint && preferredComponentSize){
                                calculateRelativeAnchor(constraint.leftAnchor, constraint.rightAnchor, preferredComponentSize.width as number);
                                calculateRelativeAnchor(constraint.topAnchor, constraint.bottomAnchor, preferredComponentSize.height as number);
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

                /** Map which contains component ids as key and positioning and sizing properties as value */
                const sizeMap = new Map<string, CSSProperties>();

                /** Build the sizemap with each component based on the constraints with their component id as key and css style as value */
                children.forEach(component => {
                    const constraint = componentConstraints.get(component.id);

                    if(constraint && marginConstraint && borderConstraint) {
                        const left = constraint.leftAnchor.getAbsolutePosition() - marginConstraint.leftAnchor.getAbsolutePosition() + margins.marginLeft;
                        const top = constraint.topAnchor.getAbsolutePosition() - marginConstraint.topAnchor.getAbsolutePosition() + margins.marginTop;
                        const width = constraint.rightAnchor.getAbsolutePosition() - constraint.leftAnchor.getAbsolutePosition();
                        const height = constraint.bottomAnchor.getAbsolutePosition() - constraint.topAnchor.getAbsolutePosition();
                        sizeMap.set(component.id, {
                            position: "absolute",
                            height: height,
                            width: width,
                            left: left,
                            top: top
                        });
                    }
                });
                if(borderConstraint && marginConstraint){
                    if(onLayoutCallback){
                        /** If the layout has a preferredSize set, report it */
                        if (baseProps.preferredSize) {
                            onLayoutCallback(baseProps.preferredSize.height, baseProps.preferredSize.width);
                        }
                        /** Report the preferredSize to the parent layout */
                        else {
                            onLayoutCallback(preferredHeight, preferredWidth);
                        }
                            
                    }

                    /** Set the state of the calculated Style */
                    setCalculatedStyle( {
                        style: {
                            height: borderConstraint.bottomAnchor.position - borderConstraint.topAnchor.position,
                            width: borderConstraint.rightAnchor.position - borderConstraint.leftAnchor.position,
                            left:  style?.left || marginConstraint.leftAnchor.getAbsolutePosition(),
                            top:  style?.top || marginConstraint.topAnchor.getAbsolutePosition(),
                            position: "relative",
                        },
                        componentSizes: sizeMap
                    });
                }
            }

            /** Call the calculating functions */
            setAnchorsAndConstraints();
            calculateAnchors();
            calculateTargetDependentAnchors();
            buildComponents();
        }, [baseProps.preferredSize]
    );

    useEffect(() => {
        /** Gets the Childcomponents of the layout */
        const children = context.contentStore.getChildren(id);
        /** 
         * If compSizes is set (every component in this layout reported its preferred size) 
         * and the compSize is the same as children size calculate the layout 
         */
        if(compSizes && compSizes.size === children.size){
            calculateLayout(
                compSizes,
                children,
                layout,
                layoutData,
                reportSize,
                style
            )
        }
    }, [layout, layoutData, compSizes, style.width, style.height, id, calculateLayout, context.contentStore])

    return(
        /** Provide the allowed sizes of the children as a context */
        <LayoutContext.Provider value={calculatedStyle?.componentSizes || new Map<string, React.CSSProperties>()}>
            <div data-layout="form" style={{...calculatedStyle?.style}}>
                {components}
            </div>
        </LayoutContext.Provider>
    )
}

export default FormLayout