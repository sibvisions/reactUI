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

import React, { CSSProperties, FC, useContext, useEffect, useMemo, useState } from "react";
import {appContext, isDesignerVisible} from "../../contexts/AppProvider";
import { LayoutContext } from "../../LayoutContext";
import Margins from "./models/Margins";
import IBaseComponent from "../../util/types/IBaseComponent";
import { useRunAfterLayout } from "../../hooks/components-hooks/useRunAfterLayout";
import COMPONENT_CLASSNAMES from "../COMPONENT_CLASSNAMES";
import { ILayout, clearDesignerLayoutInfo, isDesignerActive } from "./Layout";
import Gaps from "./models/Gaps";
import { ORIENTATION } from "./models/Anchor";
import { HORIZONTAL_ALIGNMENT, VERTICAL_ALIGNMENT } from "./models/ALIGNMENT";
import { FlowGrid } from "./models/FlowGrid";
import Dimension from "../../util/types/Dimension";
import { LAYOUTS } from "../../util/types/designer/LayoutInformation";
import { setComponentIndeces } from "../../util/designer-util/setComponentIndeces";
import { FlowLayoutAssistant } from "../../util/types/designer/LayoutAssistant";

/**
 * A flow layout arranges components in a directional flow, muchlike lines of text in a paragraph.
 * @param baseProps - the properties sent by the Layout component
 */
const FlowLayout: FC<ILayout> = (baseProps) => {
    /** Extract variables from baseprops */
    const {
        components,
        layout,
        compSizes,
        style,
        id,
        reportSize,
        alignChildrenIfOverflow = true,
        isToolBar,
        parent,
        className,
        panelType,
        hasBorder,
        name
    } = baseProps

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Margins of the FlowLayout */
    const margins = new Margins(layout.substring(layout.indexOf(',') + 1, layout.length).split(',').slice(0, 4));

    /** Current state of the calculatedStyle by the FormLayout */
    const [calculatedStyle, setCalculatedStyle] = useState<CSSProperties>();

    /** Callback which gets called when the layout is done layouting */
    const runAfterLayout = useRunAfterLayout();

    /** The FlowLayout-Assistant used for the designer, if it isn't already available, initialise it */
    const flowLayoutAssistant = useMemo(() => {
        if (context.designer && isDesignerVisible(context.designer)) {
            const compConstraintMap:Map<string, string> = new Map<string, string>();
            // FlowLayout has no constraints
            components.forEach(component => compConstraintMap.set(component.props.name, "flow-no-constraints"));
            if (!context.designer.flowLayouts.has(name)) {
                context.designer.createFlowLayoutAssistant({
                    id: id,
                    name: name,
                    originalConstraints: compConstraintMap,
                    componentSizes: compSizes,
                    componentIndeces: [],
                    componentConstraints: new Map<string, string>(),
                    calculatedSize: null,
                    layoutType: LAYOUTS.FLOWLAYOUT,
                    autoWrap: (layout.split(",")[11] === 'true'),
                    orientation: parseInt(layout.split(",")[7]) === ORIENTATION.HORIZONTAL ? ORIENTATION.HORIZONTAL : ORIENTATION.VERTICAL
                })
            }
            else {
                context.designer.flowLayouts.get(name)!.layoutInfo.originalConstraints = compConstraintMap;
            }
            return context.designer.flowLayouts.get(name) as FlowLayoutAssistant;
        }
        else {
            return null;
        }
    }, [context.designer, context.designer?.isVisible]);

    // The layoutinfo of the FlowLayout-Assistant
    const layoutInfo = useMemo(() => {
        if (flowLayoutAssistant) {
            return flowLayoutAssistant.layoutInfo;
        }
        else {
            return null;
        }
    }, [flowLayoutAssistant]);

    /** 
     * Returns a Map, the keys are the ids of the components, the values are the positioning and sizing properties given to the child components 
     * @returns a Map key: component ids, value style properties for components
     */
    const componentSizes = useMemo(() => {
        const layoutParts = layout.split(',');
        /** Map which contains component ids as key and positioning and sizing properties as value */
        const sizeMap = new Map<string, CSSProperties>();
        /** Gaps between the components */
        const gaps = new Gaps(layoutParts.slice(5, 7));
        /** Horizontal alignment of layout */
        const outerHa = parseInt(layoutParts[8]);
        /** Vertical alignment of layout */
        const outerVa = parseInt(layoutParts[9]);
        /** Alignment of the components */
        const innerAlignment = parseInt(layoutParts[10]);
        /** Wether the layout should be wrapped if there is not enough space for all components */
        const autoWrap = (layoutParts[11] === 'true')
        /** If the orientation is horizontal */
        const isRowOrientation = parseInt(layoutParts[7]) === ORIENTATION.HORIZONTAL;

        /** Filters the toolbars from the children, if the FlowLayout is a Frame or ToolbarPanel, undefined if there are no toolbars */
        const toolBarsFiltered:[string, IBaseComponent][]|undefined = parent ? 
            id.includes("-tbMain") ? 
                [...context.contentStore.getChildren(id, className)] 
            : 
                [...context.contentStore.getChildren(panelType === "Frame-Toolbar" ? id : parent + "-tbMain", className)].filter(child => child[1].className === COMPONENT_CLASSNAMES.TOOLBAR) 
        : undefined;

        /** The children of the Panel, only the toolbars if it is a frame */
        const children = panelType === "Frame-Toolbar" ? new Map(toolBarsFiltered) : context.contentStore.getChildren(id, className);

        /** Sorts the Childcomponent based on indexOf property */
        const childrenSorted = new Map([...children.entries()].sort((a, b) => {return (a[1].indexOf as number) - (b[1].indexOf as number)}));

        /** The gap between toolbars */
        const toolbarGap = isToolBar ? parseInt(window.getComputedStyle(document.documentElement).getPropertyValue('--toolbar-gap')) : 0;
        const toolbarHalfGap = 5 + toolbarGap * .5;

        /** The gap in toolbars */
        const toolbarCompExtraGap = isToolBar ? parseInt(window.getComputedStyle(document.documentElement).getPropertyValue('--toolbar-comp-gap')) : 0;

        // Adding an extra gap between components in a toolbar for styling reasons
        if (isToolBar) {
            if (isRowOrientation) {
                gaps.horizontalGap += toolbarCompExtraGap;
            }
            else {
                gaps.verticalGap += toolbarCompExtraGap
            }
        }

        /**
         * Checks if the bar is first toolbar
         * @param id - the id of the toolbar
         * @returns 
         */
         const isFirstToolBar = (id:string) => {
            if (toolBarsFiltered && toolBarsFiltered.length && !id.includes("-tbMain")) {
                return toolBarsFiltered.findIndex(entry => entry[1].id === id) === 0 ? true : false;
            }
            return true;
        }

        /**
         * Checks if the bar is last toolbar
         * @param id - the id of the toolbar
         * @returns 
         */
        const isLastToolBar = (id:string) => {
            if (toolBarsFiltered && toolBarsFiltered.length && !id.includes("-tbMain")) {
                return toolBarsFiltered.findIndex(entry => entry[1].id === id) === toolBarsFiltered.length - 1 ? true : false;
            }
            return false;
        }

        /** If compSizes is set (every component in this layout reported its preferred size) */
        if(compSizes && childrenSorted.size === compSizes.size && context.contentStore.getComponentById(id)?.visible !== false) {
            clearDesignerLayoutInfo(flowLayoutAssistant, LAYOUTS.FLOWLAYOUT);

            /**
	         * Gets the factor for an alignment value. The factor will be used
	         * to align the components in the layout.
             * @param alignment - the alignment
             * @returns the factor for an alignment value
             */
            const getAlignmentFactor = (alignment:number) => {
                switch (alignment) {
                    case HORIZONTAL_ALIGNMENT.LEFT:
                    case VERTICAL_ALIGNMENT.TOP:
                        return 0;
                    case HORIZONTAL_ALIGNMENT.CENTER:
                        return 0.5;
                    case HORIZONTAL_ALIGNMENT.RIGHT:
                    case VERTICAL_ALIGNMENT.BOTTOM:
                        return 1;
                    default:
                        console.error('Invalid alignment: ' + alignment);
                        return 0;
                }
            }

            /** Calculates the grid for the FlowLayout */
            const calculateGrid = ():FlowGrid => {
                /** Calculated height of the latest column of the FlowLayout */
                let calcHeight = 0;
                /** Calculated width of the latest row of the FlowLayout */
                let calcWidth = 0;

                /** The width of the FlowLayout */
                let width = 0;
                /** The height of the FlowLayout */
                let height = 0;
                /** The amount of rows in the FlowLayout */
                let anzRows = 1;
                /** The amount of columns in the FlowLayout */
                let anzCols = 1;

                /** If the current component is the first */
                let bFirst = true;

                let tbExtraSize = toolBarsFiltered?.length ? toolbarHalfGap : 0

                const boundsWidth = style.width as number - margins.marginLeft - margins.marginRight;
                const boundsHeight = style.height as number - margins.marginTop - margins.marginBottom;

                childrenSorted.forEach(component => {
                    if (component.visible !== false) {
                        const prefSize = compSizes.get(component.id)?.preferredSize || { width: 0, height: 0 };
                        if (isRowOrientation) {
                            /** If this isn't the first component add the gap between components*/
                            if (!bFirst) {
                                calcWidth += gaps.horizontalGap;
                            }
                            calcWidth += prefSize.width;
                            /** Check for the tallest component in row orientation */
                            height = Math.max(height, prefSize.height);

                            /** If autowrapping is true and the width of the row is greater than the width of the layout, add a new row */
                            if (!bFirst && autoWrap && boundsWidth > 0 && calcWidth > boundsWidth) {
                                calcWidth = prefSize.width;
                                anzRows++;
                            }
                            else if (bFirst) {
                                bFirst = false;
                            }
                            /** Check if the current row is wider than the current width of the FlowLayout */
                            width = Math.max(width, calcWidth);
                        }
                        else {
                            /** If this isn't the first component add the gap between components*/
                            if (!bFirst) {
                                calcHeight += gaps.verticalGap;
                            }
                            calcHeight += prefSize.height;
                            /** Check for the widest component in row orientation */
                            width = Math.max(width, prefSize.width);

                            /** If autowrapping is true and the height of the column is greater than the height of the layout, add a new column */
                            if (!bFirst && autoWrap && boundsHeight > 0 && calcHeight > boundsHeight) {
                                calcHeight = prefSize.height;
                                anzCols++;
                            }
                            else if (bFirst) {
                                bFirst = false;
                            }
                            /** Check if the current column is taller than the current height of the FlowLayout */
                            height = Math.max(height, calcHeight);
                        }
                    }

                    // Set the correct indices of the component for the FlowLayout-Assistent in the designer
                    if (isDesignerActive(flowLayoutAssistant)) {
                        setComponentIndeces(layoutInfo, component.name, component.indexOf);
                    }
                });
                if (tbExtraSize !== 0) {
                    isRowOrientation ? width += tbExtraSize : height += tbExtraSize;
                }
                const grid:FlowGrid = {columns: anzCols, rows: anzRows, gridWidth: width, gridHeight: height}
                return grid;
            }

            const flowLayoutInfo = calculateGrid();
            const prefSize:Dimension = { width: (flowLayoutInfo.gridWidth * flowLayoutInfo.columns + gaps.horizontalGap * (flowLayoutInfo.columns-1)),
                                         height: (flowLayoutInfo.gridHeight * flowLayoutInfo.rows + gaps.verticalGap * (flowLayoutInfo.rows-1)) };
            let left:number;
            let width:number;
            const borderWidth = parseInt(window.getComputedStyle(document.documentElement).getPropertyValue("--input-border-width"));

            if (outerHa === HORIZONTAL_ALIGNMENT.STRETCH) {
                left = margins.marginLeft;
                width = (style.width as number) - margins.marginLeft - margins.marginRight;
            }
            else {
                if (style.width) {
                    left = ((style.width as number - margins.marginLeft - margins.marginRight - prefSize.width - (hasBorder && !isNaN(borderWidth) ? borderWidth * 2 : 0))) * getAlignmentFactor(outerHa) + margins.marginLeft;
                }
                else {
                    left = 0;
                }
                width = prefSize.width;
            }

            let top:number;
            let height:number;

            if (outerVa === VERTICAL_ALIGNMENT.STRETCH) {
                top = margins.marginTop;
                if (style.height) {
                    height = (style.height as number) - margins.marginTop - margins.marginBottom;
                }
                else {
                    height = prefSize.height - margins.marginTop - margins.marginBottom;
                }
            }
            else {
                if (style.height) {
                    top = ((style.height as number) - margins.marginBottom - margins.marginTop - prefSize.height - (hasBorder && !isNaN(borderWidth) ? borderWidth * 2 : 0)) * getAlignmentFactor(outerVa) + margins.marginTop;
                }
                else {
                    top = 0;
                }
                height = prefSize.height;
            }

            if(top < 0 && !alignChildrenIfOverflow) {
                top = 0;
            }

            /** The FlowLayout width */
            let fW = Math.max(1, width);
            /** The FlowLayout preferred width */
            let fPW = Math.max(1, prefSize.width);
            /** The FlowLayout preferred height*/
            let fH = Math.max(1, height);
            /** The FlowLayout preferred height */
            let fPH = Math.max(1, prefSize.height);
            /** x stores the columns */
            let x = 0;
            /** y stores the rows */
            let y = 0;

            let bFirst = true;
            /**
             * Build the sizemap with each component based on the constraints with their component id as key and css style as value
             * Calculations are taken from "JVxSequenceLayout" I don't want to explain something wrong if I maybe misinterpret something
             * so I won't put comments in the calculation.
             */
            childrenSorted.forEach(component => {
                if (component.visible !== false) {
                    const size = compSizes.get(component.id)?.preferredSize || {width: 0, height: 0};

                    if (isRowOrientation) {
                        if (!bFirst && autoWrap && (style.width as number) > 0 && x + size.width > (style.width as number)) {
                            x = 0;
                            y += Math.floor((flowLayoutInfo.gridHeight + gaps.verticalGap) * fH / fPH);
                        }

                        if (innerAlignment === VERTICAL_ALIGNMENT.STRETCH) {
                            sizeMap.set(component.id, {
                                left: Math.floor((left + x * fW / fPW)),
                                top: top + y,
                                width: Math.floor(size.width * fW / fPW),
                                height: Math.floor(flowLayoutInfo.gridHeight * fH / fPH),
                                position: "absolute"
                            });
                        }
                        else {
                            sizeMap.set(component.id, {
                                left: Math.floor((left + x * fW / fPW)),
                                top: Math.floor(top + y + ((flowLayoutInfo.gridHeight - size.height) * getAlignmentFactor(innerAlignment)) * fH / fPH),
                                width: Math.floor(size.width * fW / fPW),
                                height: Math.floor(size.height * fH / fPH),
                                position: "absolute"
                            });
                        }

                        if (bFirst) {
                            bFirst = false;
                        }

                        x += size.width + gaps.horizontalGap;
                    }
                    else {
                        if (!bFirst && autoWrap && (style.height as number) > 0 && y + size.height > (style.height as number)) {
                            y = 0;
                            x += Math.floor((flowLayoutInfo.gridWidth + gaps.horizontalGap) * fW / fPW);
                        }
                            
                        if (innerAlignment === HORIZONTAL_ALIGNMENT.STRETCH) {
                            sizeMap.set(component.id, {
                                left: left + x,
                                top: Math.floor(top + y * fH / fPH),
                                width: Math.floor(flowLayoutInfo.gridWidth * fW / fPW),
                                height: Math.floor(size.height * fH / fPH),
                                position: "absolute",
                            });
                        }
                        else {
                            sizeMap.set(component.id, {
                                left: Math.floor(left + x + ((flowLayoutInfo.gridWidth - size.width) * getAlignmentFactor(innerAlignment)) * fW / fPW),
                                top: Math.floor(top + y * fH / fPH),
                                width: Math.floor(size.width * fW / fPW),
                                height: Math.floor(size.height * fH / fPH),
                                position: "absolute"
                            });
                        }

                        if (bFirst) {
                            bFirst = false;
                        }

                        y += size.height + gaps.verticalGap;
                    }
                }
            });

            /** If reportSize is set and the layout has not received a size by their parent layout (if possible) or the size of the layout changed, report the size */
            if((reportSize && !style.width && !style.height) || (prefSize.height !== style.height || prefSize.width !== style.width)) {
                runAfterLayout(() => {
                    reportSize({
                        height: prefSize.height + margins.marginTop + margins.marginBottom + (toolBarsFiltered?.length ? (!isFirstToolBar(id) && !isRowOrientation) ? toolbarHalfGap : 0 : 0), 
                        width: prefSize.width + margins.marginLeft + margins.marginRight + (toolBarsFiltered?.length ? (!isFirstToolBar(id) && isRowOrientation) ? toolbarHalfGap : 0 : 0)
                    });
                });
            }
            if (baseProps.popupSize) {
                setCalculatedStyle({ 
                    height: baseProps.popupSize.height, 
                    width: baseProps.popupSize.width, 
                    position: 'relative', 
                    left: style?.left || toolBarsFiltered?.length ? (!isFirstToolBar(id) && isRowOrientation) ? toolbarHalfGap : 0 : 0,
                    top: style?.top || toolBarsFiltered?.length ? (!isFirstToolBar(id) && !isRowOrientation) ? toolbarHalfGap : 0 : 0 
                });
            }
            else {
                const height = (style?.height || prefSize.height + margins.marginTop + margins.marginBottom) as number;
                const width = (style?.width || prefSize.width + margins.marginLeft + margins.marginRight) as number;
                setCalculatedStyle({ 
                    height: height - (toolBarsFiltered?.length ? (!isFirstToolBar(id) && !isRowOrientation) ? toolbarHalfGap : 0 : 0), 
                    width: width - (toolBarsFiltered?.length ? (!isFirstToolBar(id) && isRowOrientation) ? toolbarHalfGap : 0 : 0), 
                    position: 'relative', 
                    left: style?.left || toolBarsFiltered?.length ? (!isFirstToolBar(id) && isRowOrientation) ? toolbarHalfGap : 0 : 0, 
                    top: style?.top || toolBarsFiltered?.length ? (!isFirstToolBar(id) && !isRowOrientation) ? toolbarHalfGap : 0 : 0 
                });
            }
        }
        return sizeMap;
    }, [compSizes, style.width, style.height, reportSize, id, context.contentStore, flowLayoutAssistant, components]);

    // Designer layoutinfo needs current componentSizes
    useEffect(() => {
        if (context.designer && isDesignerVisible(context.designer) && context.designer.flowLayouts.has(name)) {
            context.designer.flowLayouts.get(name)!.layoutInfo.componentSizes = compSizes;
        }
    }, [compSizes, context.designer?.isVisible]);

    return(
        /** Provide the allowed sizes of the children as a context */
        <LayoutContext.Provider value={componentSizes}>
            <div className="rc-layout-element" data-layout="flow" data-name={name} style={calculatedStyle}>
                {components}
            </div>
        </LayoutContext.Provider>
    )
}
export default FlowLayout