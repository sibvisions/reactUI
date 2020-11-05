import React, {CSSProperties, FC, useLayoutEffect, useMemo, useRef, useState} from "react";
import {LayoutContext} from "../../LayoutContext";
import {ORIENTATION} from "./models/Anchor";
import Gaps from "./models/Gaps";
import {HORIZONTAL_ALIGNMENT, VERTICAL_ALIGNMENT} from "./models/ALIGNMENT";
import {ILayout} from "./Layout";

const FlowLayout: FC<ILayout> = (baseProps) => {

    const {
        components,
        layout,
        preferredCompSizes,
        style,
        id,
        onLoad
    } = baseProps

    const [preferredSize, setPreferredSize] = useState<{ style: CSSProperties, componentSize: Map<string, CSSProperties> }>({style: {}, componentSize: new Map<string, React.CSSProperties>()})
    const divRef = useRef<HTMLDivElement>(null);

    const gaps = useMemo(() => {
        return  new Gaps(layout.substring(layout.indexOf(',') + 1, layout.length).split(',').slice(4, 6));
    }, [layout]);

    const orientation = useMemo(() => {
        return parseInt(layout.split(",")[7]);
    }, [layout]);

    const alignments = useMemo(() => {
        const splitAlignments = layout.split(",")
        let va: string = "center"; let ha: string = "center"; let ca: string = "center";
        if(parseInt(splitAlignments[8]) === HORIZONTAL_ALIGNMENT.LEFT)
            ha = "flex-start";
        else if(parseInt(splitAlignments[8]) === HORIZONTAL_ALIGNMENT.RIGHT)
            ha = "flex-end";
        else if(parseInt(splitAlignments[8]) === HORIZONTAL_ALIGNMENT.STRETCH)
            ha = "stretch"

        if(parseInt(splitAlignments[9]) === VERTICAL_ALIGNMENT.TOP)
            va = "flex-start";
        else if(parseInt(splitAlignments[9]) === VERTICAL_ALIGNMENT.BOTTOM)
            va = "flex-end";
        else if(parseInt(splitAlignments[9]) === HORIZONTAL_ALIGNMENT.STRETCH)
            va = "stretch"

        if(parseInt(splitAlignments[10]) === VERTICAL_ALIGNMENT.TOP)
            ca = "flex-start";
        else if(parseInt(splitAlignments[10]) === VERTICAL_ALIGNMENT.BOTTOM)
            ca = "flex-end";
        return {va: va, ha: ha, ca: ca}

    }, [layout]);

    // CalculateComps
    useLayoutEffect(() => {
        let height = 0; let width = 0
        if(preferredCompSizes){
            if(orientation === ORIENTATION.HORIZONTAL){
                preferredCompSizes.forEach(value => {
                    if(value.height > height){
                        height = value.height;
                    } width += value.width + gaps.horizontalGap;
                });
            } else {
                preferredCompSizes.forEach(value => {
                    if(value.width > width){
                        width = value.width;
                    } height += value.height + gaps.vertical;
                });
            }
        }
        setPreferredSize({style: {height: height, width: width}, componentSize: preferredCompSizes || new Map<string, CSSProperties>()})
        //@ts-ignore
        if(onLoad) {
            onLoad(id, height, width);
        }

    }, [preferredCompSizes, gaps, orientation, id, onLoad])

    return(
        <div id={id} style={{
            width: style.width || "100%",
            height: style.height || "100%",
            left: style.left,
            top: style.top,
            position: style.position,
            display: "flex",
            justifyContent: alignments.ha,
            alignItems: alignments.va}}>
            <LayoutContext.Provider value={preferredSize.componentSize}>
                <div
                    ref={divRef}
                    style={{
                        display: "flex",
                        flexDirection: orientation === ORIENTATION.HORIZONTAL ? 'row' : 'column',
                        justifyContent: "space-between",
                        alignItems: alignments.ca,
                        // backgroundColor: background,
                        ...preferredSize.style
                    }}>
                    {components}
                </div>
            </LayoutContext.Provider>

        </div>
    )
}
export default FlowLayout