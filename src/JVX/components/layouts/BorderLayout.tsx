/** React imports */
import React, { CSSProperties, FC, useContext, useMemo } from "react";

/** Other imports */
import { LayoutContext } from "../../LayoutContext"
import { jvxContext } from "../../jvxProvider";
import { ILayout } from "./Layout";
import { ComponentSize } from "../zhooks";
import { Margins } from "./";

/** Type for borderLayoutComponents */
type borderLayoutComponents = {
    north: ComponentSize,
    center: ComponentSize,
    west: ComponentSize,
    east: ComponentSize,
    south: ComponentSize
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
    const context = useContext(jvxContext);
    /** Margins of the BorderLayout */
    const margins = new Margins(layout.substring(layout.indexOf(',') + 1, layout.length).split(',').slice(0, 4))


    /** 
     * Returns a Map, the keys are the ids of the components, the values are the positioning and sizing properties given to the child components 
     * @returns a Map key: component ids, value style properties for components
     */
    const componentSizes = useMemo(() => {
        /** Map which contains component ids as key and positioning and sizing properties as value */
        const sizeMap = new Map<string, CSSProperties>();

        /** If compSizes is set (every component in this layout reported its sizes) */
        if(compSizes) {
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
                if(component.constraints === "North")
                    constraintSizes.north = preferredSize;
                else if(component.constraints === "South")
                    constraintSizes.south = preferredSize;
                else if(component.constraints === "East")
                    constraintSizes.east = preferredSize;
                else if(component.constraints === "West")
                    constraintSizes.west = preferredSize;
                else if(component.constraints === "Center")
                    constraintSizes.center = preferredSize;
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
                if(style.height)
                    centerHeight = style.height as number - constraintSizes.south.height - constraintSizes.north.height;
                return centerHeight - margins.marginTop - margins.marginBottom;
            }

            /**
             * Returns the width of the center component
             * @returns - the width of the center component
             */
            const getCenterWidth = () => {
                let centerWidth = constraintSizes.center.width;
                /** If this layout has a set width by another layout, calculate the width of center */
                if(style.width)
                    centerWidth = style.width as number - constraintSizes.west.width - constraintSizes.east.width;
                return centerWidth - margins.marginLeft - margins.marginRight;
            }

            /**
             * Returns the left positioning of the east component
             * @returns - the left positioning of the east component
             */
            const getEastLeft = () => {
                /** Left of east is the sum of the widths of west and center */
                let eastLeft = constraintSizes.west.width + constraintSizes.center.width;
                /** If this layout has a set width by another layout, left of east is the width of the layout substracted by margin right and east width */
                if(style.width)
                    eastLeft = style.width as number - constraintSizes.east.width - margins.marginRight
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
                if(style.height) {
                    southTop = style.height as number - constraintSizes.south.height;
                }
                /** substract bottom margin */
                return southTop - margins.marginBottom;
            }

            /** Sets the style properties for north component */
            const northCSS: CSSProperties = {
                position: "absolute",
                top: margins.marginTop,
                left: margins.marginLeft,
                /** If this layout has a set width by another layout, use the width */
                width: (style.width as number || constraintSizes.north.width) - margins.marginLeft - margins.marginRight,
                height: constraintSizes.north.height
            }

            /** Sets the style for the west component */
            const westCSS: CSSProperties = {
                position: "absolute",
                top: constraintSizes.north.height+margins.marginTop,
                left: margins.marginLeft,
                width: constraintSizes.west.width,
                height: getCenterHeight()
            }

            /** Sets the style for the center component */
            const centerCSS: CSSProperties = {
                position: "absolute",
                top: constraintSizes.north.height+margins.marginTop,
                left: constraintSizes.west.width+margins.marginLeft,
                width: getCenterWidth(),
                height: getCenterHeight()
            }

            /** Sets the style for the east component */
            const eastCSS: CSSProperties = {
                position: "absolute",
                top: constraintSizes.north.height+margins.marginTop,
                left: getEastLeft(),
                width: constraintSizes.east.width,
                height: getCenterHeight()
            }

            /** Sets the style for the south component */
            const southCSS: CSSProperties = {
                position: "absolute",
                top: getSouthTop(),
                left: margins.marginLeft,
                width: (style.width as number || constraintSizes.south.width) - margins.marginLeft - margins.marginRight,
                height: constraintSizes.south.height,
            }

            /** Build the sizemap with each component based on the constraints with their component id as key and css style as value */
            children.forEach(component => {
                if(component.constraints === "North")
                    sizeMap.set(component.id, northCSS);
                else if(component.constraints === "South")
                    sizeMap.set(component.id, southCSS);
                else if(component.constraints === "Center")
                    sizeMap.set(component.id, centerCSS);
                else if (component.constraints === "West")
                    sizeMap.set(component.id, westCSS);
                else if (component.constraints === "East")
                    sizeMap.set(component.id, eastCSS);
            });

            const preferredWidth = Math.max(...[constraintSizes.north.width, constraintSizes.center.width+constraintSizes.east.width+constraintSizes.west.width, constraintSizes.south.width]);
            const preferredHeight = Math.max(...[constraintSizes.west.height + constraintSizes.center.height + constraintSizes.east.height]) + constraintSizes.north.height + constraintSizes.south.height;
            /** If reportSize is set and the layout has not received a size by their parent layout (if possible) or the size of the layout changed, report the size */
            if((reportSize && !style.width && !style.height) || (preferredHeight !== style.height || preferredWidth !== style.width)) {
                reportSize(preferredHeight, preferredWidth)
            }
        }
        return sizeMap;
    }, [compSizes, style.width, style.height, reportSize, id, context.contentStore, margins.marginBottom, margins.marginLeft, margins.marginRight, margins.marginTop])

    return(
        /** Provide the allowed sizes of the children as a context */
        <LayoutContext.Provider value={componentSizes}>
            <div style={{ position: "relative", ...style}}>
                {components}
            </div>
        </LayoutContext.Provider>
    )
}
export default BorderLayout