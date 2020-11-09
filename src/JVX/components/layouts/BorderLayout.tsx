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
        onLoad,
        id,
    } = baseProps



    const context = useContext(jvxContext);




    const componentSizes = useMemo(() => {
        const sizeMap = new Map<string, CSSProperties>();

        if(preferredCompSizes){
            const constraintSizes: borderLayoutComponents = {
                center: {height: style.height as number, width: style.width as number},
                east: {height: style.height as number, width: 0},
                west: {height: style.height as number, width: 0},
                north: {height: 0, width: style.width as number},
                south: {height: 0, width: style.width as number}
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
            });

            // Build SizeMap

            const northCSS: CSSProperties = {
                position: "absolute",
                top: 0,
                left: 0,
                width: style.width,
                height: constraintSizes.north.height
            }

            const centerCSS: CSSProperties = {
                position: "absolute",
                top: constraintSizes.north.height,
                left: 0,
                width: constraintSizes.center.width - constraintSizes.east.width - constraintSizes.west.width,
                height: constraintSizes.center.height - constraintSizes.north.height - constraintSizes.south.height,

            }

            const southCSS: CSSProperties = {
                position: "absolute",
                top: constraintSizes.center.height - constraintSizes.south.height,
                left: 0,
                width: style.width,
                height: constraintSizes.south.height,
            }

            componentProps.forEach(component => {
                if(component.constraints === "North")
                    sizeMap.set(component.id, northCSS);
                else if(component.constraints === "South")
                    sizeMap.set(component.id, southCSS);
                else if(component.constraints === "Center")
                    sizeMap.set(component.id, centerCSS)
            });
        }

        if(onLoad){
            onLoad(id, style.height, style.width);
        }
        return sizeMap;
    }, [preferredCompSizes, style, components])


    return(
        <LayoutContext.Provider value={componentSizes}>
            <div style={{ position: "relative", ...style}}>
                {components}
            </div>
        </LayoutContext.Provider>
    )
}
export default BorderLayout