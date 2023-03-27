/* Copyright 2022 SIB Visions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import React, { CSSProperties, FC, useCallback, useContext, useMemo, useRef } from "react";
import { appContext } from "../../contexts/AppProvider";
import { LayoutContext } from "../../LayoutContext";
import BaseComponent from "../../util/types/BaseComponent";
import { getMinimumSize, getPreferredSize } from "../../util/component-util/SizeUtil";
import { ILayout } from "./Layout";
import { ComponentSizes } from "../../hooks/components-hooks/useComponents";
import Anchor from "./models/Anchor";
import Constraints from "./models/Constraints";
import Margins from "./models/Margins";
import Gaps from "./models/Gaps";
import Dimension from "../../util/types/Dimension";
import { HORIZONTAL_ALIGNMENT, VERTICAL_ALIGNMENT } from "./models/ALIGNMENT";
import { useRunAfterLayout } from "../../hooks/components-hooks/useRunAfterLayout";
import { FormLayoutInformation, useVisionXDesigner } from "@sibvisions/visionx/dist/moduleIndex";

/**
 * The FormLayout is a simple to use Layout which allows complex forms.
 * Calculations are taken from "JVxFormLayout"
 * @param baseProps - the properties sent by the Layout component
 */
const FormLayout: FC<ILayout> = (baseProps) => {

    /** Current state of the calculatedStyle by the FormLayout */
    const calculatedStyle = useRef<{ style?: CSSProperties, componentSizes?: Map<string, CSSProperties> }>();

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    const designer = useVisionXDesigner();

    const runAfterLayout = useRunAfterLayout();

    /** Extract variables from baseprops */
    const {
        components,
        layout,
        layoutData,
        compSizes,
        style,
        id,
        name,
        reportSize,
        maximumSize,
        minimumSize,
        className
    } = baseProps;

    const layoutInfo = useMemo(() => {
        if (designer) {
            if (!designer.formLayouts.has(name)) {
                const gaps = new Gaps(layout.substring(layout.indexOf(',') + 1, layout.length).split(',').slice(4, 6));
                designer.formLayouts.set(name, {
                    name: name,
                    horizontalGap: gaps.horizontalGap,
                    verticalGap: gaps.verticalGap,
                    horizontalAnchors: [],
                    verticalAnchors: [],
                    anchorToColumnMap: new Map<string, number>(),
                    horizontalColumnToAnchorMap: new Map<string, { leftAnchor: Anchor, rightAnchor: Anchor }>(),
                    verticalColumnToAnchorMap: new Map<string, { topAnchor: Anchor, bottomAnchor: Anchor }>()
                })
            }
            return designer.formLayouts.get(name) as FormLayoutInformation;
        }
        else {
            return null;
        }

    }, [designer]);

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
                const clearLayoutInfo = () => {
                    const castedLayoutInfo = layoutInfo as FormLayoutInformation;
                    castedLayoutInfo.horizontalAnchors = [];
                    castedLayoutInfo.verticalAnchors = [];
                    castedLayoutInfo.anchorToColumnMap.clear();
                    castedLayoutInfo.horizontalColumnToAnchorMap.clear();
                    castedLayoutInfo.verticalColumnToAnchorMap.clear();
                }

                anchors.clear(); componentConstraints.clear();
                if (layoutInfo !== null) {
                    clearLayoutInfo();
                }
                /** Parse layout info and fill Anchors-Map */
                const splitAnchors: Array<string> = layoutData.split(";");
                splitAnchors.forEach(anchorData => {
                    const name = anchorData.substring(0, anchorData.indexOf(","));
                    anchors.set(name, new Anchor(anchorData));
                });

                /** Establish related Anchors */
                anchors.forEach(anchor => {
                    anchor.relatedAnchor = anchors.get(anchor.relatedAnchorName);
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
                            if (diffSize > -anchor.position) {
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
                        const diffSize = (preferredSize - fixedSize + autoSizeCount - 1) / autoSizeCount;
                        autoSizeAnchors.forEach(anchor => {
                            if (diffSize > anchor.position) {
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
                        if (!anchor.firstCalculation) {
                            anchor.autoSizeCalculated = true;
                            counter++;
                        }
                    });
                    return autoSizeAnchors.length - counter
                }

                /**
                 * clears auto size position of anchors
                 */
                const clearAutoSize = (layoutInfo:FormLayoutInformation|null, pAnchor: Anchor, isHorizontal: boolean) => {
                    let anchor:Anchor | undefined = pAnchor;
                    let anchorList = layoutInfo !== null ? (isHorizontal ? layoutInfo.horizontalAnchors : layoutInfo.verticalAnchors) : [];
                    //
                    const pos = anchorList ? anchorList.length : 0;

                    const containsAnchor = (anchor:Anchor) => {
                        for (let i = 0; i < anchorList.length; i++) {
                            if (anchorList[i].name === anchor.name) {
                                return true;
                            }
                        }
                        return false;
                    }

                    while (anchor && !containsAnchor(anchor)) {
                        anchorList.splice(pos, 0, anchor);
                        
                        anchor.relative = anchor.autoSize;
                        anchor.autoSizeCalculated = false;
                        anchor.firstCalculation = true;
                        anchor.used = false;
                        if(anchor.autoSize) {
                            anchor.position = 0;
                        }

                        anchor = anchor.relatedAnchor;
                    }
                    pAnchor.used = true;
                }

                children.forEach(component => {
                    const constraint = componentConstraints.get(component.id);
                    if (component.visible !== false && constraint && constraint.leftAnchor && constraint.rightAnchor && constraint.topAnchor && constraint.bottomAnchor) {
                        clearAutoSize(layoutInfo, constraint.leftAnchor, true);
                        clearAutoSize(layoutInfo, constraint.rightAnchor, true);
                        clearAutoSize(layoutInfo, constraint.topAnchor, false);
                        clearAutoSize(layoutInfo, constraint.bottomAnchor, false);
                    }
                })

                if (layoutInfo !== null) {
                    // add border-anchors to layoutInfo if they aren't already added
                    if (!layoutInfo.horizontalAnchors.some(anchor => anchor.name === "l")) {
                        layoutInfo.horizontalAnchors.splice(0, 0, anchors.get("l") as Anchor);
                    }
                    if (!layoutInfo.horizontalAnchors.some(anchor => anchor.name === "r")) {
                        if (layoutInfo.horizontalAnchors.some(anchor => anchor.name === "rm"))  {
                            const marginIndex = layoutInfo.horizontalAnchors.findIndex(anchor => anchor.name === "rm");
                            layoutInfo.horizontalAnchors.splice(marginIndex, 0, anchors.get("r") as Anchor);
                        }
                        else {
                            layoutInfo.horizontalAnchors.push(anchors.get("r") as Anchor);
                            layoutInfo.horizontalAnchors.push(anchors.get("rm") as Anchor);
                        }
                    }
                    if (!layoutInfo.verticalAnchors.some(anchor => anchor.name === "t")) {
                        layoutInfo.verticalAnchors.splice(0, 0, anchors.get("t") as Anchor);
                    }
                    if (!layoutInfo.verticalAnchors.some(anchor => anchor.name === "b")) {
                        if (layoutInfo.verticalAnchors.some(anchor => anchor.name === "bm"))  {
                            const marginIndex = layoutInfo.verticalAnchors.findIndex(anchor => anchor.name === "bm");
                            layoutInfo.verticalAnchors.splice(marginIndex, 0, anchors.get("b") as Anchor);
                        }
                        else {
                            layoutInfo.verticalAnchors.push(anchors.get("b") as Anchor);
                            layoutInfo.verticalAnchors.push(anchors.get("bm") as Anchor);
                        }
                    }

                    designer.fillFormLayoutInfo(layoutInfo);
                }

                componentConstraints.forEach((val) => {
                    val.bottomAnchor.used = true;
                    val.leftAnchor.used = true;
                    val.rightAnchor.used = true;
                    val.topAnchor.used = true;
                })

                /** Init autosize Anchor position */
                anchors.forEach(anchor => {
                    const relatedAutoSizeAnchor = anchor.relatedAnchor
                    if (relatedAutoSizeAnchor) {
                        if (!anchor.used && relatedAutoSizeAnchor!.used && !relatedAutoSizeAnchor.name.includes("m")) {
                        anchor.used = true;
                        }

                        if (relatedAutoSizeAnchor!.autoSize &&
                            !anchor.autoSize &&
                            relatedAutoSizeAnchor.relatedAnchor != null &&
                            !relatedAutoSizeAnchor.relatedAnchor!.autoSize) {
                                relatedAutoSizeAnchor.position = relatedAutoSizeAnchor.used ? -relatedAutoSizeAnchor.relatedAnchor!.position : -anchor.position;
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

                /** Calculate preferredSize */
                children.forEach(component => {
                    if(component.visible !== false){
                        const constraint = componentConstraints.get(component.id);
                        const preferredComponentSize = getPreferredSize(component, compSizes);
                        const minimumComponentSize = getMinimumSize(component, compSizes);

                        if(constraint && preferredComponentSize && minimumComponentSize) {
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
                    if (leftTopAnchor.relative) {
                        const rightBottom = rightBottomAnchor.getRelativeAnchor();
                        if(rightBottom && rightBottom !== leftTopAnchor) {
                            let pref = rightBottom.getAbsolutePosition() - rightBottomAnchor.getAbsolutePosition() + preferredSize;
                            let size = 0;
                            if(rightBottom.relatedAnchor && leftTopAnchor.relatedAnchor){
                                size = rightBottom.relatedAnchor.getAbsolutePosition() - leftTopAnchor.relatedAnchor.getAbsolutePosition();
                            }
                            let pos = pref - size;

                            if (pos < 0) {
                                pos /= 2;
                            } 
                            else {
                                pos -= pos/2;
                            }

                            if (rightBottom.firstCalculation || pos > rightBottom.position) {
                                rightBottom.firstCalculation = false;
                                rightBottom.position = pos;
                            }
                            pos = pref - size - pos;
                            if (leftTopAnchor.firstCalculation || pos > - leftTopAnchor) {
                                leftTopAnchor.firstCalculation = false
                                leftTopAnchor.position = -pos;
                            }
                        }
                    }
                    else if (rightBottomAnchor.relative) {
                        console.warn("not yet implemented")
                    }
                }

                /** Set from server */
                const maxLayoutSize: {width: number, height: number} = maximumSize || {height:100000, width:100000};
                const minLayoutSize: {width: number, height: number} = minimumSize || {width: 10, height: 10};

                /** Available size set by parent layout*/
                let calcSize = {width: (style?.width as number) || 0, height: (style?.height as number) || 0};

                const minSize = getMinimumSize(minimumWidth, minimumHeight);

                if(calcSize.width < minSize.width) {
                    calcSize.width = minSize.width;
                }
                    
                if(calcSize.height < minSize.height) {
                    calcSize.height = minSize.height;
                }
                    

                // if(maximumSize) {
                //     if(calcSize.width > maximumSize.width) {
                //         calcSize.width = maximumSize.width;
                //     }
                        
                //     if(calcSize.height > maximumSize.height) {
                //         calcSize.height = maximumSize.height;
                //     }
                // }

                const lba = anchors.get("l");
                const rba = anchors.get("r");
                const bba = anchors.get("b");
                const tba = anchors.get("t");
                if(calculatedTargetDependentAnchors && lba && rba && bba && tba && calcSize) {
                    if(horizontalAlignment === HORIZONTAL_ALIGNMENT.STRETCH || (leftBorderUsed && rightBorderUsed)) {
                        if(minLayoutSize.width > calcSize.width){
                            lba.position = 0;
                            rba.position = minLayoutSize.width;
                        }
                        else if(maxLayoutSize.width < calcSize.width) {
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
                            switch (horizontalAlignment) {
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
                    if(onLayoutCallback) {
                        runAfterLayout(() => {
                            /** If the layout has a preferredSize set, report it */
                            if (baseProps.preferredSize) {
                                onLayoutCallback({ height: baseProps.preferredSize.height, width: baseProps.preferredSize.width }, { height: minimumHeight, width: minimumWidth });
                            }
                            /** Report the preferredSize to the parent layout */
                            else {
                                onLayoutCallback({ height: preferredHeight, width: preferredWidth }, { height: minimumHeight, width: minimumWidth });
                            }
                        })
                    }
                    /** Set the state of the calculated Style */
                    calculatedStyle.current = {
                        style: {
                            height: borderConstraint.bottomAnchor.position - borderConstraint.topAnchor.position,
                            width: borderConstraint.rightAnchor.position - borderConstraint.leftAnchor.position,
                            left:  style?.left || marginConstraint.leftAnchor.getAbsolutePosition(),
                            top:  style?.top || marginConstraint.topAnchor.getAbsolutePosition(),
                            position: "relative",
                        },
                        componentSizes: (style.height !== undefined && style.width !== undefined) ? sizeMap : undefined
                    };
                }
            }

            /** Call the calculating functions */
            setAnchorsAndConstraints();
            calculateAnchors();
            calculateTargetDependentAnchors();
            buildComponents();
        }, [baseProps.preferredSize, layoutInfo]
    );

    //XXX: maybe refactor so that this memo returns the actual style instead of setting a ref
    //we use useMemo here so that the calculated values written into the ref can be used in the return statement
    //otherwise this calculation would run separately and would need a re render
    useMemo(() => {
        const children = context.contentStore.getChildren(id, className);
        console.log(children, compSizes)
        /** 
         * If compSizes is set (every component in this layout reported its preferred size) 
         * and the compSize is the same as children size calculate the layout 
         */
        if(compSizes && compSizes.size === children.size && context.contentStore.getComponentById(id)?.visible !== false){
            calculateLayout(
                compSizes,
                children,
                layout,
                layoutData,
                reportSize,
                style
            )
        }

        return calculatedStyle.current;
    }, [layout, layoutData, compSizes, style.width, style.height, id, calculateLayout, context.contentStore])

    return(
        /** Provide the allowed sizes of the children as a context */
        <LayoutContext.Provider value={calculatedStyle.current?.componentSizes || new Map<string, React.CSSProperties>()}>
            <div className="rc-layout-element" data-layout="form" data-name={name} style={{...calculatedStyle.current?.style}}>
                {components}
            </div>
        </LayoutContext.Provider>
    )
}

export default FormLayout