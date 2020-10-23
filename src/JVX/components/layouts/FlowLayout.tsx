import React, {CSSProperties, FC, useContext, useLayoutEffect, useMemo, useRef, useState} from "react";
import useComponents from "../zhooks/useComponents";
import {LayoutContext} from "../../LayoutContext";
import {ORIENTATION} from "./models/Anchor";
import Gaps from "./models/Gaps";
import {HORIZONTAL_ALIGNMENT, VERTICAL_ALIGNMENT} from "./models/ALIGNMENT";
import {Panel} from "../panels/panel/UIPanel";

const FlowLayout: FC<Panel> = (props) => {

    const [preferredSize, setPreferredSize] = useState<{ style: CSSProperties, componentSize: Map<string, CSSProperties> }>({style: {}, componentSize: new Map<string, React.CSSProperties>()})
    const [components, preferredComponentSizes] = useComponents(props.id);
    const layoutContext = useContext(LayoutContext);
    const divRef = useRef<HTMLDivElement>(null);

    const gaps = useMemo(() => {
        return  new Gaps(props.layout.substring(props.layout.indexOf(',') + 1, props.layout.length).split(',').slice(4, 6));
    }, [props.layout]);

    const orientation = useMemo(() => {
        return parseInt(props.layout.split(",")[7]);
    }, [props.layout]);

    const alignments = useMemo(() => {
        const splitAlignments = props.layout.split(",")
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
        // else if(parseInt(splitAlignments[10]) === HORIZONTAL_ALIGNMENT.STRETCH)
        //     ca = "stretch"
        return {va: va, ha: ha, ca: ca}
    }, [props.layout]);

    // CalculateComps
    useLayoutEffect(() => {
        let height = 0; let width = 0
        if(preferredComponentSizes){
            if(orientation === ORIENTATION.HORIZONTAL){
                preferredComponentSizes.forEach(value => {
                   if(value.height > height){
                       height = value.height;
                   } width += value.width + gaps.horizontalGap;
                });
            } else {
                preferredComponentSizes.forEach(value => {
                    console.log(value.width)
                    if(value.width > width){
                        width = value.width;
                    } height += value.height + gaps.vertical;
                });
            }
        }
        setPreferredSize({style: {height: height, width: width}, componentSize: preferredComponentSizes || new Map<string, CSSProperties>()})
        //@ts-ignore
        if(props.onLoadCallback) {
            props.onLoadCallback(props.id, height, width);
        }
            
    }, [preferredComponentSizes, gaps, props, orientation])

    return(
        <div id={props.id} style={{
                width: layoutContext.get(props.id)?.width || "100%",
                height: layoutContext.get(props.id)?.height || "100%",
                left: layoutContext.get(props.id)?.left,
                top: layoutContext.get(props.id)?.top,
                position: layoutContext.get(props.id)?.position,
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
                        backgroundColor: props.background,
                        ...preferredSize.style
                    }}>
                    {components}
                </div>
            </LayoutContext.Provider>

        </div>
    )
}
export default FlowLayout