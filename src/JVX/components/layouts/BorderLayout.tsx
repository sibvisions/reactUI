import React, {
    CSSProperties,
    FC,
    useContext,
    useMemo,
} from "react";
import {LayoutContext} from "../../LayoutContext"
import "./BorderLayout.scss"
import {jvxContext} from "../../jvxProvider";
import {ILayout} from "./Layout";
import {ComponentSize} from "../zhooks/useComponents";
import Margins from "./models/Margins";

type borderLayoutComponents = {
    north: ComponentSize,
    center: ComponentSize,
    west: ComponentSize,
    east: ComponentSize,
    south: ComponentSize
}

const BorderLayout: FC<ILayout> = (baseProps) => {


    const {
        components,
        preferredCompSizes,
        style,
        reportSize,
        id,
        layout
    } = baseProps



    const context = useContext(jvxContext);
    const margins = new Margins(layout.substring(layout.indexOf(',') + 1, layout.length).split(',').slice(0, 4))


    const componentSizes = useMemo(() => {
        const sizeMap = new Map<string, CSSProperties>();

        if(preferredCompSizes){
            const constraintSizes: borderLayoutComponents = {
                center: {height: 0, width: 0},
                east: {height: 0, width: 0},
                west: {height: 0, width: 0},
                north: {height: 0, width: 0},
                south: {height: 0, width: 0}
            }

            // Get preferredSizes
            const componentProps = context.contentStore.getChildren(id);
            componentProps.forEach(component => {
                const preferredSize = preferredCompSizes.get(component.id) || {height: 0, width: 0};
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

            const getCenterHeight = () => {
                let centerHeight = Math.max(...[constraintSizes.center.height, constraintSizes.east.height, constraintSizes.west.height]);
                if(style.height)
                    centerHeight = style.height as number - constraintSizes.south.height - constraintSizes.north.height;
                return centerHeight - margins.marginTop - margins.marginBottom;
            }
            const getCenterWidth = () => {
                let centerWidth = constraintSizes.center.width;
                if(style.width)
                    centerWidth = style.width as number - constraintSizes.west.width - constraintSizes.east.width;
                return centerWidth - margins.marginLeft - margins.marginRight;
            }
            const getEastLeft = () => {
                let eastLeft = constraintSizes.west.width + constraintSizes.center.width;
                if(style.width)
                    eastLeft = style.width as number - constraintSizes.east.width - margins.marginRight
                return eastLeft;
            }
            const getSouthTop = () => {
                let southTop = constraintSizes.north.height + constraintSizes.center.height
                if(style.height){
                    southTop = style.height as number - constraintSizes.south.height;
                }
                return southTop - margins.marginBottom;
            }

            const northCSS: CSSProperties = {
                position: "absolute",
                top: margins.marginTop,
                left: margins.marginLeft,
                width: (style.width as number || constraintSizes.north.width) - margins.marginLeft - margins.marginRight,
                height: constraintSizes.north.height
            }

            const westCSS: CSSProperties = {
                position: "absolute",
                top: constraintSizes.north.height+margins.marginTop,
                left: margins.marginLeft,
                width: constraintSizes.west.width,
                height: getCenterHeight()
            }

            const centerCSS: CSSProperties = {
                position: "absolute",
                top: constraintSizes.north.height+margins.marginTop,
                left: constraintSizes.west.width+margins.marginLeft,
                width: getCenterWidth(),
                height: getCenterHeight()
            }

            const eastCSS: CSSProperties = {
                position: "absolute",
                top: constraintSizes.north.height+margins.marginTop,
                left: getEastLeft(),
                width: constraintSizes.east.width,
                height: getCenterHeight()
            }

            const southCSS: CSSProperties = {
                position: "absolute",
                top: getSouthTop(),
                left: margins.marginLeft,
                width: (style.width as number || constraintSizes.south.width) - margins.marginLeft - margins.marginRight,
                height: constraintSizes.south.height,
            }

            componentProps.forEach(component => {
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

            if(reportSize && !style.width && !style.height){
                const preferredWidth = Math.max(...[constraintSizes.north.width, constraintSizes.center.width+constraintSizes.east.width+constraintSizes.west.width, constraintSizes.south.width]);
                const preferredHeight = Math.max(...[constraintSizes.west.height + constraintSizes.center.height + constraintSizes.east.height]) + constraintSizes.north.height + constraintSizes.south.height;
                reportSize(preferredHeight, preferredWidth)
            }
            else {
                reportSize(style.height, style.width)
            }
        }


        return sizeMap;
    }, [preferredCompSizes, style.width, style.height, reportSize, id, context.contentStore, margins.marginBottom, margins.marginLeft, margins.marginRight, margins.marginTop])

    return(
        <LayoutContext.Provider value={componentSizes}>
            <div style={{ position: "relative", ...style}}>
                {components}
            </div>
        </LayoutContext.Provider>
    )
}
export default BorderLayout