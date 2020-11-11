import React, {CSSProperties, FC, lazy, useContext, useMemo} from "react";
import {LayoutContext} from "../../LayoutContext";
import Gaps from "./models/Gaps";
import {ILayout} from "./Layout";
import {jvxContext} from "../../jvxProvider";
import {HORIZONTAL_ALIGNMENT, VERTICAL_ALIGNMENT} from "./models/ALIGNMENT";
import {ORIENTATION} from "./models/Anchor";

const FlowLayout: FC<ILayout> = (baseProps) => {

    const {
        components,
        layout,
        preferredCompSizes,
        style,
        id,
        onLoad
    } = baseProps

    const context = useContext(jvxContext);

    //Outer
    //splitAlignments[8]) === HORIZONTAL_ALIGNMENT
    //splitAlignments[9]) === VERTICAL_ALIGNMENT

    //Inner
    //splitAlignments[10]) === VERTICAL_ALIGNMENT


    const componentSizes = useMemo(() => {
        const sizeMap = new Map<string, CSSProperties>();
        const gaps = new Gaps(layout.substring(layout.indexOf(',') + 1, layout.length).split(',').slice(4, 6));
        const alignments =  layout.split(",");
        const outerHa = parseInt(alignments[8]);
        const outerVa = parseInt(alignments[9]);
        const bottom = parseInt(alignments[10]) === VERTICAL_ALIGNMENT.BOTTOM
        const isRowOrientation = parseInt(alignments[7]) === ORIENTATION.HORIZONTAL

        const componentProps = context.contentStore.getChildren(id).sort((a, b) =>{
            return a.indexOf - b.indexOf;
        });

        if(preferredCompSizes){
            let totalHeight = 0;
            let tallest = 0;

            let totalWidth = 0;
            let widest = 0;

            preferredCompSizes.forEach(componentSize => {
                totalHeight += componentSize.height + gaps.vertical;
                totalWidth += componentSize.width + gaps.horizontalGap;

                if(componentSize.height > tallest)
                    tallest = componentSize.height;
                if(componentSize.width > widest)
                    widest = componentSize.width;
            });

            let alignmentTop = 0;
            let alignmentLeft = 0;

            if(style.width && style.height){
                if(isRowOrientation){
                    switch (outerVa){
                        case (VERTICAL_ALIGNMENT.CENTER): {
                            alignmentTop = (style.height as number)/2 - tallest/2;
                            break;
                        }
                        case (VERTICAL_ALIGNMENT.BOTTOM): {
                            alignmentTop = (style.height as number) - tallest;
                        }
                    }
                    switch (outerHa){
                        case (HORIZONTAL_ALIGNMENT.CENTER): {
                            alignmentLeft = (style.width as number)/2 - totalWidth/2;
                            break;
                        }
                        case (HORIZONTAL_ALIGNMENT.RIGHT): {
                            alignmentLeft = (style.width as number) - totalWidth;
                            break;
                        }
                    }
                }
                else{
                    switch (outerVa){
                        case (VERTICAL_ALIGNMENT.CENTER): {
                            alignmentTop = (style.height as number)/2 - totalHeight/2;
                            break;
                        }
                        case (VERTICAL_ALIGNMENT.BOTTOM): {
                            alignmentTop = (style.height as number) - totalHeight;
                        }
                    }
                    switch (outerHa){
                        case (HORIZONTAL_ALIGNMENT.CENTER): {
                            alignmentLeft = (style.width as number)/2 - widest/2;
                            break;
                        }
                        case (HORIZONTAL_ALIGNMENT.RIGHT): {
                            alignmentLeft = (style.width as number) - widest;
                            break;
                        }
                    }
                }
            }

            let relativeLeft = alignmentLeft;
            let relativeTop = alignmentTop;
            componentProps.forEach(component => {
                const size = preferredCompSizes.get(component.id) || {width: 0, height: 0};

                let top = relativeTop;
                let left = relativeLeft;
                let height = size.height;
                let width = size.width

                // Orientation Position
                if(isRowOrientation){
                    relativeLeft += size.width + gaps.horizontalGap;
                    if(bottom)
                        top += tallest - size.height;
                }
                else{
                    if(outerHa === HORIZONTAL_ALIGNMENT.STRETCH)
                        width = style.width as number || widest;
                    relativeTop += size.height + gaps.vertical;
                }


                sizeMap.set(component.id,{
                    height: height,
                    width: width,
                    left: left,
                    top: top,
                    position: "absolute"
                });

            });



            if(onLoad && !style.width && !style.height){
                if(isRowOrientation)
                    onLoad(id, tallest, totalWidth);
                else
                    onLoad(id, totalHeight, widest);
            }
        }




        return sizeMap;
    }, [layout, preferredCompSizes, components, onLoad, id, style])

    return(
        <LayoutContext.Provider value={componentSizes}>
            <div style={{...style, position:"absolute"}}>
                {components}
            </div>
        </LayoutContext.Provider>
    )
}
export default FlowLayout