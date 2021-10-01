/** React imports */
import React, { CSSProperties, FC, useContext, useMemo } from "react";

/** Other imports */
import {appContext} from "../../AppProvider";
import { LayoutContext } from "../../LayoutContext";
import { ILayout, Gaps, FlowGrid, HORIZONTAL_ALIGNMENT, VERTICAL_ALIGNMENT, ORIENTATION } from ".";
import { Dimension } from "../util";
import Margins from "./models/Margins";
import BaseComponent from "../BaseComponent";

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
        children,
        isToolBar,
        parent
    } = baseProps

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Margins of the BorderLayout */
    const margins = new Margins(layout.substring(layout.indexOf(',') + 1, layout.length).split(',').slice(0, 4));

    /** 
     * Returns a Map, the keys are the ids of the components, the values are the positioning and sizing properties given to the child components 
     * @returns a Map key: component ids, value style properties for components
     */
    const componentSizes = useMemo(() => {
        /** Map which contains component ids as key and positioning and sizing properties as value */
        const sizeMap = new Map<string, CSSProperties>();
        /** Gaps between the components */
        const gaps = new Gaps(layout.substring(layout.indexOf(',') + 1, layout.length).split(',').slice(4, 6));
        /** Horizontal alignment of layout */
        const outerHa = parseInt(layout.split(",")[8]);
        /** Vertical alignment of layout */
        const outerVa = parseInt(layout.split(",")[9]);
        /** Alignment of the components */
        const innerAlignment = parseInt(layout.split(",")[10]);
        /** Wether the layout should be wrapped if there is not enough space for all components */
        const autoWrap = (layout.split(",")[11] === 'true')
        /** If the orientation is horizontal */
        const isRowOrientation = parseInt(layout.split(",")[7]) === ORIENTATION.HORIZONTAL

        /** Sorts the Childcomponent based on indexOf property */
        const childrenSorted = new Map([...children.entries()].sort((a, b) => {return (a[1].indexOf as number) - (b[1].indexOf as number)}));

        const toolBarsFiltered:[string, BaseComponent][]|undefined = parent && (isToolBar || id.includes("-tbMain")) ? [...context.contentStore.getChildren(parent)].filter(entry => entry[1]["~additional"]) : undefined;

        const isNotLastToolBar = (id:string) => {
            if (toolBarsFiltered) {
                console.log(toolBarsFiltered)
                return toolBarsFiltered.findIndex(entry => entry[1].id === id) !== toolBarsFiltered.length - 1 ? true : false;
            }
            return true;
        }

        /** If compSizes is set (every component in this layout reported its preferred size) */
        if(compSizes && childrenSorted.size === compSizes.size) {
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

                let tbExtraSpace = toolBarsFiltered ? isNotLastToolBar(id) ? 5 : 0 : 0

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
                            if (!bFirst && autoWrap && (style.width as number) > 0 && calcWidth > (style.width as number)) {
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
                            if (!bFirst && autoWrap && (style.height as number) > 0 && calcHeight > (style.height as number)) {
                                calcHeight = prefSize.height;
                                anzCols++;
                            }
                            else if (bFirst)
                                bFirst = false;
                            /** Check if the current column is taller than the current height of the FlowLayout */
                            height = Math.max(height, calcHeight);
                        }
                    }
                });
                if (tbExtraSpace !== 0) {
                    isRowOrientation ? width += tbExtraSpace : height += tbExtraSpace;
                }
                const grid:FlowGrid = {columns: anzCols, rows: anzRows, gridWidth: width, gridHeight: height}
                return grid;
            }

            const flowLayoutInfo = calculateGrid();
            const prefSize:Dimension = { width: (flowLayoutInfo.gridWidth * flowLayoutInfo.columns + gaps.horizontalGap * (flowLayoutInfo.columns-1)) + margins.marginLeft + margins.marginRight,
                                         height: (flowLayoutInfo.gridHeight * flowLayoutInfo.rows + gaps.verticalGap * (flowLayoutInfo.rows-1)) + margins.marginTop + margins.marginBottom };
            
            let left:number;
            let width:number;

            if (outerHa === HORIZONTAL_ALIGNMENT.STRETCH) {
                left = margins.marginLeft;
                width = (style.width as number);
            }
            else {
                left = ((style.width as number) - prefSize.width) * getAlignmentFactor(outerHa) + margins.marginLeft;
                width = prefSize.width;
            }

            let top:number;
            let height:number;

            if (outerVa === VERTICAL_ALIGNMENT.STRETCH) {
                top = margins.marginTop;
                height = (style.height as number);
            }
            else {
                top = ((style.height as number) - prefSize.height) * getAlignmentFactor(outerVa) + margins.marginTop;
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
                            y += (flowLayoutInfo.gridHeight + gaps.verticalGap) * fH / fPH;
                        }
                        else if (bFirst)
                            bFirst = false;

                        if (innerAlignment === VERTICAL_ALIGNMENT.STRETCH) {
                            console.log(id.includes("-tbMain"))
                            sizeMap.set(component.id, {
                                left: left + x * fW / fPW,
                                top: top + y,
                                width: size.width * fW / fPW,
                                height: flowLayoutInfo.gridHeight * fH / fPH,
                                position: "absolute",
                                borderRight: id.includes("-tbMain") && isNotLastToolBar(component.id) ? "3px solid #bbb" : ""
                            });
                        }
                        else {
                            sizeMap.set(component.id, {
                                left: left + x * fW / fPW,
                                top: top + y + ((flowLayoutInfo.gridHeight - size.height) * getAlignmentFactor(innerAlignment)) * fH / fPH,
                                width: size.width * fW / fPW,
                                height: size.height * fH / fPH,
                                position: "absolute",
                                borderRight: id.includes("-tbMain") && isNotLastToolBar(component.id) ? "3px solid #bbb" : ""
                            });
                        }

                        x += size.width + gaps.horizontalGap;
                    }
                    else {
                        if (!bFirst && autoWrap && (style.height as number) > 0 && y + size.height > (style.height as number)) {
                            y = 0;
                            x += (flowLayoutInfo.gridWidth + gaps.horizontalGap) * fW / fPW;
                        }
                        else if (bFirst)
                            bFirst = false;
                        
                        if (innerAlignment === HORIZONTAL_ALIGNMENT.STRETCH) {
                            sizeMap.set(component.id, {
                                left: left + x,
                                top: top + y * fH / fPH,
                                width: flowLayoutInfo.gridWidth * fW / fPW,
                                height: size.height * fH / fPH,
                                position: "absolute",
                                borderBottom: id.includes("-tbMain") && isNotLastToolBar(component.id) ? "3px solid #bbb" : ""
                            });
                        }
                        else {
                            sizeMap.set(component.id, {
                                left: left + x + ((flowLayoutInfo.gridWidth - size.width) * getAlignmentFactor(innerAlignment)) * fW / fPW,
                                top: top + y * fH / fPH,
                                width: size.width * fW / fPW,
                                height: size.height * fH / fPH,
                                position: "absolute",
                                borderBottom: id.includes("-tbMain") && isNotLastToolBar(component.id) ? "3px solid #bbb" : ""
                            });
                        }

                        y += size.height + gaps.verticalGap
                    }
                }
            });

            /** If reportSize is set and the layout has not received a size by their parent layout (if possible) or the size of the layout changed, report the size */
            if((reportSize && !style.width && !style.height) || (prefSize.height !== style.height || prefSize.width !== style.width)) {
                reportSize({ height: prefSize.height, width: prefSize.width });
            }
        }
        return sizeMap;
    }, [compSizes, style.width, style.height, reportSize, id, context.contentStore]);

    return(
        /** Provide the allowed sizes of the children as a context */
        <LayoutContext.Provider value={componentSizes}>
            <div data-layout="flow" style={{...style, position:"absolute"}}>
                {components}
            </div>
        </LayoutContext.Provider>
    )
}
export default FlowLayout