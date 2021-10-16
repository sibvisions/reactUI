/** React imports */
import React, { CSSProperties, FC, useContext, useMemo, useState } from "react";

/** Other imports */
import { LayoutContext } from "../../LayoutContext"
import { appContext } from "../../AppProvider";
import { ILayout } from "./Layout";
import { Margins } from ".";
import { Dimension } from "../util";
import Gaps from "./models/Gaps";
import { getMinimumSize, getPreferredSize } from "../util/SizeUtil";
import { useRunAfterLayout } from "../zhooks/useRunAfterLayout";

/** Type for borderLayoutComponents */
type BorderLayoutComponents = {
    north: Dimension,
    center: Dimension,
    west: Dimension,
    east: Dimension,
    south: Dimension
}

/**
 * The BorderLayout lay outs its components in a borderly fashion.
 * @param baseProps - the properties sent by the Layout component
 */
const BorderLayout: FC<ILayout> = (baseProps) => {
    /** Extract variables from baseprops */
    const {
        components,
        compSizes,
        style,
        reportSize,
        id,
        layout,
        className
    } = baseProps


    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Current state of the calculatedStyle by the FormLayout */
    const [calculatedStyle, setCalculatedStyle] = useState<CSSProperties>();

    /** Margins of the BorderLayout */
    const margins = new Margins(layout.substring(layout.indexOf(',') + 1, layout.length).split(',').slice(0, 4));

    /** Horizontal- and vertical Gap */
    const gaps = new Gaps(layout.substring(layout.indexOf(',') + 1, layout.length).split(',').slice(4, 6));

    const runAfterLayout = useRunAfterLayout();

    /** 
     * Returns a Map, the keys are the ids of the components, the values are the positioning and sizing properties given to the child components 
     * @returns a Map key: component ids, value style properties for components
     */
    const componentSizes = useMemo(() => {
        /** Map which contains component ids as key and positioning and sizing properties as value */
        const sizeMap = new Map<string, CSSProperties>();

        const children = context.contentStore.getChildren(id, className);

        let northUsed = false;
        let westUsed = false;
        let eastUsed = false;
        let southUsed = false;
        let centerUsed = false;
        let hCompCount = 0;
        let vCompCount = 0;

        /** If compSizes is set (every component in this layout reported its sizes) */
        if(compSizes && children.size === compSizes.size) {
            /** Preferred Sizes for BorderLayout areas */
            const prefConstraintSizes: BorderLayoutComponents = {
                center: {height: 0, width: 0},
                east: {height: 0, width: 0},
                west: {height: 0, width: 0},
                north: {height: 0, width: 0},
                south: {height: 0, width: 0}
            }

            /** Minimum Sizes for BorderLayout areas */
            const minConstraintSizes: BorderLayoutComponents = {
                center: {height: 0, width: 0},
                east: {height: 0, width: 0},
                west: {height: 0, width: 0},
                north: {height: 0, width: 0},
                south: {height: 0, width: 0}
            }

            /** Get the preferredSize for the areas of the BorderLayout */
            children.forEach(component => {
                const preferredSize = getPreferredSize(component, compSizes) || {height: 0, width: 0};
                const minimumSize = getMinimumSize(component, compSizes);
                if(component.constraints === "North") {
                    prefConstraintSizes.north = preferredSize;
                    minConstraintSizes.north = minimumSize;
                    northUsed = true;
                    vCompCount++;
                }
                else if(component.constraints === "South") {
                    prefConstraintSizes.south = preferredSize;
                    minConstraintSizes.south = minimumSize;
                    southUsed = true;
                    vCompCount++
                }
                else if(component.constraints === "East") {
                    prefConstraintSizes.east = preferredSize;
                    minConstraintSizes.east = minimumSize;
                    eastUsed = true;
                    hCompCount++;
                }
                else if(component.constraints === "West") {
                    prefConstraintSizes.west = preferredSize;
                    minConstraintSizes.west = minimumSize;
                    westUsed = true;
                    hCompCount++;
                }   
                else if(component.constraints === "Center") {
                    prefConstraintSizes.center = preferredSize;
                    minConstraintSizes.center = minimumSize;
                    centerUsed = true
                    vCompCount++;
                    hCompCount++;
                }
                    
            });

            // Build SizeMap

            /**
             * Returns the height of the components west, center and east
             * @returns - the height of the components west, center and east
             */
            const getCenterHeight = () => {
                /** The biggest preferredSize height of west, center and east */
                let centerHeight = Math.max(...[prefConstraintSizes.center.height, prefConstraintSizes.east.height, prefConstraintSizes.west.height]);
                /** If this layout has a set height by another layout, calculate the centerHeight */
                if (style.height) {
                    centerHeight = style.height as number - prefConstraintSizes.south.height - prefConstraintSizes.north.height - margins.marginTop - margins.marginBottom;
                }

                if (northUsed) {
                    centerHeight -= gaps.verticalGap;
                }

                if (southUsed) {
                    centerHeight -= gaps.verticalGap;
                }

                return centerHeight;
            }

            /**
             * Returns the width of the center component
             * @returns - the width of the center component
             */
            const getCenterWidth = () => {
                let centerWidth = prefConstraintSizes.center.width;
                /** If this layout has a set width by another layout, calculate the width of center */
                if (style.width) {
                    centerWidth = style.width as number - prefConstraintSizes.west.width - prefConstraintSizes.east.width - margins.marginLeft - margins.marginRight - 2 * gaps.horizontalGap;
                }

                if (westUsed) {
                    centerWidth -= gaps.horizontalGap;
                }

                if (eastUsed) {
                    centerWidth -= gaps.horizontalGap;
                }

                return centerWidth;
            }

            /**
             * Returns the left positioning of the east component
             * @returns - the left positioning of the east component
             */
            const getEastLeft = () => {
                /** Left of east is the sum of the widths of west and center */
                let eastLeft = prefConstraintSizes.west.width + prefConstraintSizes.center.width;
                /** If this layout has a set width by another layout, left of east is the width of the layout substracted by margin right and east width */
                if (style.width) {
                    eastLeft = style.width as number - prefConstraintSizes.east.width - margins.marginRight
                }

                return eastLeft;
            }

            /**
             * Returns the top positioning of the south component
             * @returns - the top positioning of the south component
             */
            const getSouthTop = () => {
                /** Top of south is the sum of the heights of north and center */
                let southTop = prefConstraintSizes.north.height + prefConstraintSizes.center.height;
                /** If this layout has a set width by another layout, top of south is the height of the layout substracted by south height */
                if (style.height) {
                    southTop = style.height as number - prefConstraintSizes.south.height - margins.marginBottom;
                }

                return southTop;
            }

            /** Sets the style properties for north component */
            const northCSS: CSSProperties = {
                position: "absolute",
                top: margins.marginTop,
                left: margins.marginLeft,
                /** If this layout has a set width by another layout, use the width */
                width: style.width as number - margins.marginLeft - margins.marginRight
                    || Math.max(...[
                        prefConstraintSizes.north.width,
                        prefConstraintSizes.center.width + prefConstraintSizes.east.width + prefConstraintSizes.west.width,
                        prefConstraintSizes.south.width
                    ]),
                height: prefConstraintSizes.north.height
            }

            /** Sets the style for the west component */
            const westCSS: CSSProperties = {
                position: "absolute",
                top: prefConstraintSizes.north.height + margins.marginTop + (northUsed ? gaps.verticalGap : 0),
                left: margins.marginLeft,
                width: prefConstraintSizes.west.width,
                height: getCenterHeight()
            }

            /** Sets the style for the center component */
            const centerCSS: CSSProperties = {
                position: "absolute",
                top: prefConstraintSizes.north.height + margins.marginTop + (northUsed ? gaps.verticalGap : 0),
                left: prefConstraintSizes.west.width + margins.marginLeft + (westUsed ? gaps.horizontalGap : 0),
                width: getCenterWidth(),
                height: getCenterHeight()
            }

            /** Sets the style for the east component */
            const eastCSS: CSSProperties = {
                position: "absolute",
                top: prefConstraintSizes.north.height + margins.marginTop + (northUsed ? gaps.verticalGap : 0),
                left: getEastLeft(),
                width: prefConstraintSizes.east.width,
                height: getCenterHeight()
            }

            /** Sets the style for the south component */
            const southCSS: CSSProperties = {
                position: "absolute",
                top: getSouthTop(),
                left: margins.marginLeft,
                width: style.width as number - margins.marginLeft - margins.marginRight 
                || Math.max(...[
                    prefConstraintSizes.north.width,
                    prefConstraintSizes.center.width + prefConstraintSizes.east.width + prefConstraintSizes.west.width,
                    prefConstraintSizes.south.width
                ]),
                height: prefConstraintSizes.south.height,
            }

            let addVGap = vCompCount > 0 ? (vCompCount - 1) * gaps.verticalGap : 0;
            let addHGap = hCompCount > 0 ? (hCompCount - 1) * gaps.horizontalGap : 0;
            /** Build the sizemap with each component based on the constraints with their component id as key and css style as value */
            children.forEach(component => {
                if (component.constraints === "North") {
                    sizeMap.set(component.id, northCSS);
                }
                else if (component.constraints === "South") {
                    sizeMap.set(component.id, southCSS);
                }
                else if (component.constraints === "Center") {
                    sizeMap.set(component.id, centerCSS);
                }
                else if (component.constraints === "West") {
                    sizeMap.set(component.id, westCSS);
                }
                else if (component.constraints === "East") {
                    sizeMap.set(component.id, eastCSS);
                }
            });
            const preferredWidth = Math.max(...[
                Math.max(...[northCSS.width as number, southCSS.width as number]),
                ((centerCSS.width as number) + (eastCSS.width as number) + (westCSS.width as number))])
                + margins.marginLeft + margins.marginRight + addHGap;
            const preferredHeight = Math.max(...[
                Math.max(...[(westCSS.height as number), (eastCSS.height as number)]), (centerCSS.height as number)
            ]) + (northCSS.height as number) + (southCSS.height as number) + margins.marginTop + margins.marginBottom + addVGap;

            const minimumWidth = Math.max(...[
                Math.max(...[minConstraintSizes.north.width, minConstraintSizes.south.width]),
                minConstraintSizes.center.width + minConstraintSizes.east.width, minConstraintSizes.west.width
            ]) + margins.marginLeft + margins.marginRight + addHGap;
            const minimumHeight = Math.max(...[
                Math.max(...[minConstraintSizes.west.height, minConstraintSizes.east.height]), minConstraintSizes.center.height
            ]) + minConstraintSizes.north.height + minConstraintSizes.south.height + margins.marginTop + margins.marginBottom + addVGap;

            if (reportSize) {
                runAfterLayout(() => {
                    if (baseProps.preferredSize) {
                        reportSize({ height: baseProps.preferredSize.height, width: baseProps.preferredSize.width }, { height: minimumHeight, width: minimumWidth })
                    }
                    else {
                        reportSize({ height: minimumHeight || preferredHeight, width: minimumWidth || preferredWidth }, { height: minimumHeight, width: minimumWidth });
                    }
                })
            }
            
            if (baseProps.panelType === "DesktopPanel") {
                setCalculatedStyle({ height: style.height, width: style.width, position: 'relative' });
            }
            else if (baseProps.popupSize) {
                setCalculatedStyle({ height: baseProps.popupSize.height, width: baseProps.popupSize.width, position: 'relative' });
            }
            else {
                setCalculatedStyle({ height: preferredHeight, width: preferredWidth, position: 'relative' });
            }
            
        }
        return sizeMap;
    }, [compSizes, style.width, style.height, reportSize, id, context.contentStore, margins.marginBottom, margins.marginLeft, margins.marginRight, margins.marginTop]);

    return(
        /** Provide the allowed sizes of the children as a context */
        <LayoutContext.Provider value={componentSizes}>
            <div data-layout="border" style={calculatedStyle}>
                {components}
            </div>
        </LayoutContext.Provider>
    )
}
export default BorderLayout