import React, {CSSProperties, FC, useContext, useLayoutEffect, useMemo, useRef, useState} from "react";
import {layout} from "./Layout";
import useComponents from "../zhooks/useComponents";
import {LayoutContext} from "../../LayoutContext";
import {ORIENTATION} from "./models/Anchor";
import Gaps from "./models/Gaps";

const FlowLayout: FC<layout> = (props) => {

    const [components, preferredComponentSizes] = useComponents(props.id);
    const layoutContext = useContext(LayoutContext);
    const divRef = useRef<HTMLDivElement>(null);

    const gaps = useMemo(() => new Gaps(props.layout.substring(props.layout.indexOf(',') + 1, props.layout.length).split(',').slice(4, 6)), [props.layoutData])
    const orientation = useMemo(() => parseInt(props.layout.split(",")[7]), [props.layout]);
    const [preferredSize, setPreferredSize] = useState<CSSProperties>()


    // CalculateComps
    useLayoutEffect(() => {
        if(preferredComponentSizes){
            if(orientation === ORIENTATION.HORIZONTAL){
                let highest = 0; let calcWidth = 0;

                preferredComponentSizes.forEach(value => {
                   if(value.height > highest){
                       highest = value.height;
                   }
                   calcWidth += value.width + gaps.horizontalGap;
                });
                setPreferredSize({height: highest, width: calcWidth});
            } else {
                let widest = 0; let calcHeight = 0;

                preferredComponentSizes.forEach(value => {
                    if(value.width > widest){
                        widest = value.width;
                    }
                    calcHeight += value.height + gaps.vertical;
                });
                setPreferredSize({height: calcHeight, width: widest});
            }
        }
    }, [preferredComponentSizes, gaps, props.orientation])

    useLayoutEffect(() => {

    }, [components, layoutContext])


    return(
        <div style={{
                width: layoutContext.get(props.id)?.width || "100%",
                height: layoutContext.get(props.id)?.height || "100%",
                display:"flex", justifyContent: "center", alignItems:"center"}}>
            <div ref={divRef} style={preferredSize}>
                {components}
            </div>
        </div>
    )
}
export default FlowLayout