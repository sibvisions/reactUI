/** React imports */
import React, { CSSProperties, FC, useContext, useMemo, useState } from "react";

/** Other imports */
import { LayoutContext } from "../../LayoutContext"
import { appContext } from "../../AppProvider";
import { ILayout } from "./Layout";
import { Margins } from ".";
import { Dimension } from "../util";
import Gaps from "./models/Gaps";

/** Type for borderLayoutComponents */
type borderLayoutComponents = {
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
        layout
    } = baseProps


    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Current state of the calculatedStyle by the FormLayout */
    const [calculatedStyle, setCalculatedStyle] = useState<CSSProperties>();

    /** Margins of the BorderLayout */
    const margins = new Margins(layout.substring(layout.indexOf(',') + 1, layout.length).split(',').slice(0, 4));

    /** Horizontal- and vertical Gap */
    const gaps = new Gaps(layout.substring(layout.indexOf(',') + 1, layout.length).split(',').slice(4, 6));

    const children = context.contentStore.getChildren(id);


    /** 
     * Returns a Map, the keys are the ids of the components, the values are the positioning and sizing properties given to the child components 
     * @returns a Map key: component ids, value style properties for components
     */
    const componentSizes = useMemo(() => {
        /** Map which contains component ids as key and positioning and sizing properties as value */
        const sizeMap = new Map<string, CSSProperties>();

        let northUsed = false;
        let westUsed = false;
        let eastUsed = false;
        let southUsed = false;
        let centerUsed = false;
        let hCompCount = 0;
        let vCompCount = 0;

        /** If compSizes is set (every component in this layout reported its sizes) */
        if(compSizes && children.size === compSizes.size) {
            /** Sizes for BorderLayout areas */
            const constraintSizes: borderLayoutComponents = {
                center: {height: 0, width: 0},
                east: {height: 0, width: 0},
                west: {height: 0, width: 0},
                north: {height: 0, width: 0},
                south: {height: 0, width: 0}
            }

            /** Gets the Childcomponents of the layout */
            const children = context.contentStore.getChildren(id);
            /** Get the preferredSize for the areas of the BorderLayout */
            children.forEach(component => {
                const preferredSize = compSizes.get(component.id)?.preferredSize || {height: 0, width: 0};
                if(component.constraints === "North") {
                    constraintSizes.north = preferredSize;
                    northUsed = true;
                    vCompCount++;
                }
                else if(component.constraints === "South") {
                    constraintSizes.south = preferredSize;
                    southUsed = true;
                    vCompCount++
                }
                else if(component.constraints === "East") {
                    constraintSizes.east = preferredSize;
                    eastUsed = true;
                    hCompCount++;
                }
                else if(component.constraints === "West") {
                    constraintSizes.west = preferredSize;
                    westUsed = true;
                    hCompCount++;
                }   
                else if(component.constraints === "Center") {
                    constraintSizes.center = preferredSize;
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
                let centerHeight = Math.max(...[constraintSizes.center.height, constraintSizes.east.height, constraintSizes.west.height]);
                /** If this layout has a set height by another layout, calculate the centerHeight */
                if (style.height) {
                    centerHeight = style.height as number - constraintSizes.south.height - constraintSizes.north.height - margins.marginTop - margins.marginBottom;
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
                let centerWidth = constraintSizes.center.width;
                /** If this layout has a set width by another layout, calculate the width of center */
                if (style.width) {
                    centerWidth = style.width as number - constraintSizes.west.width - constraintSizes.east.width - margins.marginLeft - margins.marginRight - 2 * gaps.horizontalGap;
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
                let eastLeft = constraintSizes.west.width + constraintSizes.center.width;
                /** If this layout has a set width by another layout, left of east is the width of the layout substracted by margin right and east width */
                if (style.width) {
                    eastLeft = style.width as number - constraintSizes.east.width - margins.marginRight
                }

                return eastLeft;
            }

            /**
             * Returns the top positioning of the south component
             * @returns - the top positioning of the south component
             */
            const getSouthTop = () => {
                /** Top of south is the sum of the heights of north and center */
                let southTop = constraintSizes.north.height + constraintSizes.center.height;
                /** If this layout has a set width by another layout, top of south is the height of the layout substracted by south height */
                if (style.height) {
                    southTop = style.height as number - constraintSizes.south.height - margins.marginBottom;
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
                        constraintSizes.north.width,
                        constraintSizes.center.width + constraintSizes.east.width + constraintSizes.west.width,
                        constraintSizes.south.width
                    ]),
                height: constraintSizes.north.height
            }

            /** Sets the style for the west component */
            const westCSS: CSSProperties = {
                position: "absolute",
                top: constraintSizes.north.height + margins.marginTop + (northUsed ? gaps.verticalGap : 0),
                left: margins.marginLeft,
                width: constraintSizes.west.width,
                height: getCenterHeight()
            }

            /** Sets the style for the center component */
            const centerCSS: CSSProperties = {
                position: "absolute",
                top: constraintSizes.north.height + margins.marginTop + (northUsed ? gaps.verticalGap : 0),
                left: constraintSizes.west.width + margins.marginLeft + (westUsed ? gaps.horizontalGap : 0),
                width: getCenterWidth(),
                height: getCenterHeight()
            }

            /** Sets the style for the east component */
            const eastCSS: CSSProperties = {
                position: "absolute",
                top: constraintSizes.north.height + margins.marginTop + (northUsed ? gaps.verticalGap : 0),
                left: getEastLeft(),
                width: constraintSizes.east.width,
                height: getCenterHeight()
            }

            /** Sets the style for the south component */
            const southCSS: CSSProperties = {
                position: "absolute",
                top: getSouthTop(),
                left: margins.marginLeft,
                width: style.width as number - margins.marginLeft - margins.marginRight 
                || Math.max(...[
                    constraintSizes.north.width,
                    constraintSizes.center.width + constraintSizes.east.width + constraintSizes.west.width,
                    constraintSizes.south.width
                ]),
                height: constraintSizes.south.height,
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
            const preferredWidth = Math.max(...[constraintSizes.north.width, constraintSizes.center.width+constraintSizes.east.width+constraintSizes.west.width, constraintSizes.south.width]) + margins.marginLeft + margins.marginRight + addHGap;
            const preferredHeight = Math.max(...[constraintSizes.west.height + constraintSizes.center.height + constraintSizes.east.height]) + constraintSizes.north.height + constraintSizes.south.height + margins.marginTop + margins.marginBottom + addVGap;
            if (reportSize) {
                if (baseProps.preferredSize) {
                    reportSize(baseProps.preferredSize.height, baseProps.preferredSize.width)
                }
                else {
                    reportSize(preferredHeight, preferredWidth)
                }
            }
            
            if (baseProps.panelType === "DesktopPanel") {
                setCalculatedStyle({ height: style.height, width: style.width, position: 'relative' });
            }
            else if (baseProps.popupSize) {
                setCalculatedStyle({ height: baseProps.popupSize.height, width: baseProps.popupSize.width, position: 'relative' });
            }
            else {
                setCalculatedStyle({ height: preferredHeight, width: preferredWidth, position: 'relative'});
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