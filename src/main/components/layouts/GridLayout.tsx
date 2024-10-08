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

import React, { CSSProperties, FC, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {appContext, isDesignerVisible} from "../../contexts/AppProvider";
import {LayoutContext} from "../../LayoutContext";
import Dimension from "../../util/types/Dimension";
import { ILayout, clearDesignerLayoutInfo, isDesignerActive } from "./Layout";
import CellConstraints from "./models/CellConstraints";
import Gaps from "./models/Gaps";
import GridSize from "./models/GridSize";
import Margins from "./models/Margins";
import { useRunAfterLayout } from "../../hooks/components-hooks/useRunAfterLayout";
import { LAYOUTS } from "../../util/types/designer/LayoutInformation";
import { GridLayoutAssistant } from "../../util/types/designer/LayoutAssistant";

/**
 * The GridLayout is a component that lays out a container's
 * components in a rectangular grid.
 * @param baseProps - the properties sent by the Layout component
 */
const GridLayout: FC<ILayout> = (baseProps) => {
    /** Extract variables from baseprops */
    const {
        components,
        layout,
        compSizes,
        style,
        id,
        reportSize,
        className,
        name
    } = baseProps;

    /** Current state of the calculatedStyle by the GridLayout */
    const [calculatedStyle, setCalculatedStyle] = useState<CSSProperties>();
    
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Callback which gets called when the layout is done layouting */
    const runAfterLayout = useRunAfterLayout();

    /** Margins of layout */
    const margins = useMemo(() => new Margins(layout.substring(layout.indexOf(',') + 1, layout.length).split(',').slice(0, 4)), [layout]);

    /** Gaps between the components */
    const gaps = useMemo(() => new Gaps(layout.substring(layout.indexOf(',') + 1, layout.length).split(',').slice(4, 6)), [layout]);

    /** GridSize of the layout */
    const gridSize = useMemo(() => new GridSize(layout.substring(layout.indexOf(',') + 1, layout.length).split(',').slice(6, 8)), [layout]);

    /** The children of this panel/layout */
    const children = context.contentStore.getChildren(id, className);

    /** Contains the previous sizeMap to provide a fallback when children and compSizes aren't the same size */
    const prevSizeMap = useRef<Map<string, CSSProperties>>(new Map<string, CSSProperties>());

    /** The GridLayout-Assistant used for the designer, if it isn't already available, initialise it */
    const gridLayoutAssistant = useMemo(() => {
        if (context.designer && isDesignerVisible(context.designer)) {
            const compConstraintMap:Map<string, string> = new Map<string, string>();
            components.forEach(component => compConstraintMap.set(component.props.name, component.props.constraints));
            if (!context.designer.gridLayouts.has(name)) {
                context.designer.createGridLayoutAssistant({
                    id: id,
                    name: name,
                    originalConstraints: compConstraintMap,
                    componentSizes: compSizes,
                    componentConstraints: new Map<string, string>(),
                    componentIndeces: [],
                    calculatedSize: null,
                    layoutType: LAYOUTS.GRIDLAYOUT,
                    gridSize: gridSize,
                    currentSize: null,
                    rowSize: 0,
                    columnSize: 0
                })
            }
            else {
                context.designer.gridLayouts.get(name)!.layoutInfo.originalConstraints = compConstraintMap;
            }
            return context.designer.gridLayouts.get(name) as GridLayoutAssistant;
        }
        else {
            return null;
        }
    }, [context.designer, context.designer?.isVisible, gridSize]);

    // The layoutinfo of the BorderLayout-Assistant
    const layoutInfo = useMemo(() => {
        if (gridLayoutAssistant) {
            return gridLayoutAssistant.layoutInfo;
        }
        else {
            return null;
        }
    }, [gridLayoutAssistant]);

    /** 
     * Returns a Map, the keys are the ids of the components, the values are the positioning and sizing properties given to the child components 
     * @returns a Map key: component ids, value style properties for components
     */
    const componentSizes = useMemo(() => {
        /** Map which contains component ids as key and positioning and sizing properties as value */
        const sizeMap = new Map<string, CSSProperties>();

        /** If compSizes is set (every component in this layout reported its preferred size) */
        if (compSizes && children.size === compSizes.size && context.contentStore.getComponentById(id)?.visible !== false) {
            clearDesignerLayoutInfo(gridLayoutAssistant, LAYOUTS.GRIDLAYOUT);
            
            /** The widest single grid of all components */
            let maxWidth = 0;
            /** The tallest single grid of all components */
            let maxHeight = 0;

            const size:Dimension = { width: 0, height: 0 }

            let targetColumns = gridSize.columns;
            let targetRows = gridSize.rows;
            
            children.forEach(component => {
                if (component.constraints && component.visible !== false) {
                    const constraints = new CellConstraints(component.constraints);

                    // Add the components with their constraints into the layoutinfo
                    if (isDesignerActive(gridLayoutAssistant) && layoutInfo) {
                        layoutInfo.componentConstraints.set(component.name, component.constraints);
                    }

                    const prefSize = compSizes.get(component.id)?.preferredSize || {width: 0, height: 0};

                    const width = Math.floor((prefSize.width + constraints.gridWidth - 1) / constraints.gridWidth + constraints.margins.marginLeft + constraints.margins.marginRight);
                    if (width > maxWidth) {
                        maxWidth = width;
                    }

                    const height = Math.floor((prefSize.height + constraints.gridHeight - 1) / constraints.gridHeight + constraints.margins.marginTop + constraints.margins.marginBottom);
                    if (height > maxHeight) {
                        maxHeight = height;
                    }

                    if (gridSize.columns <= 0 && constraints.gridX + constraints.gridWidth > targetColumns) {
                        targetColumns = constraints.gridX + constraints.gridWidth;
                    }
                    if (gridSize.rows <= 0 && constraints.gridY + constraints.gridHeight > targetRows) {
                        targetRows = constraints.gridY + constraints.gridHeight;
                    }

                    // /** Calculate how wide one single grid would be for the component based on the preferred width and how many grids the component is wide */
                    // const widthOneField = Math.ceil(prefSize.width / componentConstraints.gridWidth);
                    // /** Calculate how tall one single grid would be for the component based on the preferred height and how many grids the component is tall */
                    // const heightOneField = Math.ceil(prefSize.height / componentConstraints.gridHeight);
                    // if (widthOneField > widest)
                    //     widest = widthOneField;
                    // if (heightOneField > tallest)
                    //     tallest = heightOneField;
                }
            });

            let calcWidth = maxWidth * targetColumns + margins.marginLeft + margins.marginRight + gaps.horizontalGap * (targetColumns - 1);
            let calcHeight = maxHeight * targetRows + margins.marginTop + margins.marginBottom + gaps.verticalGap * (targetRows - 1);

            /** If there is a size set by parent layout use that */
            if (style.width && style.height) {
                size.width = style.width as number;
                size.height = style.height as number;
            }
            /** Or take the tallest/widest single grid times the rows/columns minus margins */
            else {
                size.width = maxWidth * targetColumns + margins.marginLeft + margins.marginRight + gaps.horizontalGap * (targetColumns - 1);
                size.height = maxHeight * targetRows + margins.marginTop + margins.marginBottom + gaps.verticalGap * (targetRows - 1);
            }

            const xPosition: number[] = [];
            const yPosition: number[] = [];
            let columnSize: number;
            let rowSize: number;

            if (targetColumns > 0 && targetRows > 0) {
                const totalGapsWidth = (targetColumns - 1) * gaps.horizontalGap;
                const totalGapsHeight = (targetRows - 1) * gaps.verticalGap;

                const totalWidth = size.width - margins.marginLeft - margins.marginRight - totalGapsWidth;
                const totalHeight = size.height - margins.marginTop - margins.marginBottom - totalGapsHeight;


                columnSize = Math.floor(totalWidth / targetColumns);
                rowSize = Math.floor(totalHeight / targetRows);

                if (isDesignerActive(gridLayoutAssistant) && layoutInfo) {
                    layoutInfo.columnSize = columnSize;
                    layoutInfo.rowSize = rowSize;
                }

                const widthCalcError = totalWidth - columnSize * targetColumns;
				const heightCalcError = totalHeight - rowSize * targetRows;
				let xMiddle = 0;
				if (widthCalcError > 0) {
					xMiddle = Math.floor((targetColumns / widthCalcError + 1) / 2);
				}
				let yMiddle = 0;
				if (heightCalcError > 0) {
					yMiddle = Math.floor((targetRows / heightCalcError + 1) / 2);
				}

                xPosition[0] = margins.marginLeft;
                let corrX = 0;
                for (let i = 0; i < targetColumns; i++) {
                    xPosition[i + 1] = xPosition[i] + columnSize + gaps.horizontalGap;
					if (widthCalcError > 0 && Math.floor(corrX * targetColumns / widthCalcError + xMiddle) == i) {
						xPosition[i + 1]++;
						corrX++;
					}
                }

                yPosition[0] = margins.marginLeft;
                let corrY = 0;
                for (let i = 0; i < targetRows; i++) {
                    yPosition[i + 1] = yPosition[i] + rowSize + gaps.verticalGap;
					if (heightCalcError > 0 && Math.floor(corrY * targetRows / heightCalcError + yMiddle) == i) {
						yPosition[i + 1]++;
						corrY++;
					}
                }
            }

            const getPosition = (pPositions: number[], pIndex: number, pSize: number, pGap: number) => {
                if (pIndex < 0) {
                    return pPositions[0] + pIndex * (pSize + pGap);
                }
                else if (pIndex >= pPositions.length) {
                    return pPositions[pPositions.length - 1] + (pIndex - pPositions.length + 1) * (pSize + pGap);
                }
                else {
                    return pPositions[pIndex];
                }
            }

            /** Calculate the sizes and build the sizeMap with each component based on the constraints with their component id as key and css style as value */
            children.forEach(component => {
                if (component.constraints && component.visible !== false) {
                    const constraints = new CellConstraints(component.constraints);
                    const x = getPosition(xPosition, constraints.gridX, columnSize, gaps.horizontalGap) + constraints.margins.marginLeft;
                    const y = getPosition(yPosition, constraints.gridY, rowSize, gaps.verticalGap) + constraints.margins.marginTop;
                    const width = getPosition(xPosition, constraints.gridX + constraints.gridWidth, columnSize, gaps.horizontalGap) - x - gaps.horizontalGap - constraints.margins.marginRight;
                    const height = getPosition(yPosition, constraints.gridY + constraints.gridHeight, rowSize, gaps.verticalGap) - y - gaps.verticalGap - constraints.margins.marginBottom;
                    sizeMap.set(component.id, {
                        height: height,
                        width: width,
                        left: x,
                        top: y,
                        position: "absolute"
                    });
                }

            });
            /** If reportSize is set and the layout has not received a size by their parent layout (if possible) or the size of the layout changed, report the size */
            if ((reportSize && !style.width && !style.height) || (calcHeight !== style.height || calcWidth !== style.width)) {
                runAfterLayout(() => {
                    reportSize({height: calcHeight, width: calcWidth});
                })
                
            }

            if (isDesignerActive(gridLayoutAssistant) && layoutInfo) {
                layoutInfo.currentSize = size;
            }
            /** Set the state of the calculated Style */
            setCalculatedStyle({height: size.height, width: size.width, position: 'relative'});
            prevSizeMap.current = sizeMap;
            return sizeMap
        }
        return prevSizeMap.current;
    },[layout, compSizes, reportSize, id, style, context.contentStore]);

    // Designer layoutinfo needs current componentSizes
    useEffect(() => {
        if (context.designer && isDesignerVisible(context.designer) && context.designer.gridLayouts.has(name)) {
            context.designer.gridLayouts.get(name)!.layoutInfo.componentSizes = compSizes;
        }
    }, [compSizes, context.designer?.isVisible]);

    return (
        /** Provide the allowed sizes of the children as a context */
        <LayoutContext.Provider value={componentSizes}>
            <div className="rc-layout-element" data-layout="grid" data-name={name} style={calculatedStyle}>
                {components}
            </div>
        </LayoutContext.Provider>
    )

}
export default GridLayout;