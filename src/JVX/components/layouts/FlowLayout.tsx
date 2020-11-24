import React, {CSSProperties, FC, useContext, useMemo} from "react";
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
        reportSize
    } = baseProps

    const context = useContext(jvxContext);

    const componentSizes = useMemo(() => {
        const sizeMap = new Map<string, CSSProperties>();
        const gaps = new Gaps(layout.substring(layout.indexOf(',') + 1, layout.length).split(',').slice(4, 6));
        const alignments =  layout.split(",");
        const outerHa = parseInt(alignments[8]);
        const outerVa = parseInt(alignments[9]);
        const innerAlignment = parseInt(alignments[10]);
        const autoWrap = alignments[11]
        const isRowOrientation = parseInt(alignments[7]) === ORIENTATION.HORIZONTAL

        const componentProps = context.contentStore.getChildren(id)

        const componentPropsSorted = new Map([...componentProps.entries()].sort((a, b) => {return a[1].indexOf - b[1].indexOf}))

        if(preferredCompSizes){
            let totalHeight = 0;
            let tallest = 0;

            let totalWidth = 0;
            let widest = 0;

            preferredCompSizes.forEach(componentSize => {
                if (totalHeight + componentSize.height + gaps.horizontalGap <= (style.height as number))
                totalHeight += componentSize.height + gaps.horizontalGap;
                if (totalWidth + componentSize.width + gaps.verticalGap <= (style.width as number))
                    totalWidth += componentSize.width + gaps.verticalGap;

                if(componentSize.height > tallest)
                    tallest = componentSize.height;
                if(componentSize.width > widest)
                    widest = componentSize.width;
            });

            let alignmentTop = 0;
            let alignmentLeft = 0;

            let stretchValue = 0;

            if(style.width && style.height){
                if(isRowOrientation){
                    if(outerVa === VERTICAL_ALIGNMENT.CENTER)
                        alignmentTop = (style.height as number)/2 - tallest/2;
                    else if(outerVa === VERTICAL_ALIGNMENT.BOTTOM)
                        alignmentTop = (style.height as number) - tallest;

                    if(outerHa === HORIZONTAL_ALIGNMENT.CENTER)
                        alignmentLeft = (style.width as number)/2 - totalWidth/2;
                    else if(outerHa === HORIZONTAL_ALIGNMENT.RIGHT)
                        alignmentLeft = (style.width as number) - totalWidth;
                    else if(outerHa === HORIZONTAL_ALIGNMENT.STRETCH){
                        stretchValue = (style.width as number - totalWidth + gaps.verticalGap) / componentProps.size
                    }
                }
                else{
                    if(outerVa === VERTICAL_ALIGNMENT.CENTER)
                        alignmentTop = (style.height as number)/2 - totalHeight/2;
                    else if(outerVa === VERTICAL_ALIGNMENT.BOTTOM)
                        alignmentTop = (style.height as number) - totalHeight;
                    else if(outerVa === VERTICAL_ALIGNMENT.STRETCH)
                        stretchValue = (style.height as number - totalHeight + gaps.horizontalGap) / componentProps.size

                    if(outerHa === HORIZONTAL_ALIGNMENT.CENTER)
                        alignmentLeft = (style.width as number)/2 - widest/2;
                    else if(outerHa === HORIZONTAL_ALIGNMENT.RIGHT)
                        alignmentLeft = (style.width as number) - widest;
                }
            }

            let relativeLeft = alignmentLeft;
            let relativeTop = alignmentTop;
            let test = 0;

            componentPropsSorted.forEach(component => {
                const size = preferredCompSizes.get(component.id) || {width: 0, height: 0};
                let top = relativeTop;
                let left = relativeLeft;
                let height = size.height;
                let width = size.width;

                // Orientation Position
                if(isRowOrientation){
                    if(innerAlignment === VERTICAL_ALIGNMENT.BOTTOM)
                        top += tallest - size.height;
                    else if(innerAlignment === VERTICAL_ALIGNMENT.CENTER)
                        top += (tallest - size.height)/2;
                    else if(innerAlignment === VERTICAL_ALIGNMENT.STRETCH)
                        height = tallest;

                    if(outerHa === HORIZONTAL_ALIGNMENT.STRETCH)
                        width += stretchValue
                    if(outerVa === VERTICAL_ALIGNMENT.STRETCH) {
                        top = relativeTop;
                        height = style.height as number || tallest;
                    }

                    if (relativeLeft + width + gaps.horizontalGap > (style.width as number) && autoWrap) {
                        if (outerVa === VERTICAL_ALIGNMENT.CENTER || outerVa === VERTICAL_ALIGNMENT.TOP || outerVa === VERTICAL_ALIGNMENT.STRETCH) {
                            top += tallest
                            relativeTop += tallest
                            relativeLeft = alignmentLeft;
                            left = relativeLeft
                        }
                        else if (outerVa === VERTICAL_ALIGNMENT.BOTTOM) {
                            componentPropsSorted.forEach(component => {
                                const s = sizeMap.get(component.id)
                                if (s)
                                    (s.top as number) -= tallest
                            })
                            relativeLeft = alignmentLeft;
                            left = relativeLeft
                        }
                    }

                    relativeLeft += width + gaps.verticalGap;
                }
                else{
                    if(innerAlignment === HORIZONTAL_ALIGNMENT.RIGHT)
                        left += widest - size.width;
                    if(innerAlignment === HORIZONTAL_ALIGNMENT.CENTER)
                        left += (widest - size.width)/2;
                    if(innerAlignment === HORIZONTAL_ALIGNMENT.STRETCH)
                        width = widest;

                    if(outerVa === VERTICAL_ALIGNMENT.STRETCH)
                        height += stretchValue;
                    if(outerHa === HORIZONTAL_ALIGNMENT.STRETCH){
                        left = relativeLeft;
                        width = style.width as number || widest;
                    }

                    if (test !== 0) {
                        width = test - gaps.horizontalGap
                    }

                    //console.log(totalHeight, relativeTop, style.height)

                    if (relativeTop + height + gaps.verticalGap > (style.height as number) && autoWrap) {
                        console.log('yo')
                        if (outerHa === HORIZONTAL_ALIGNMENT.CENTER) {
                            componentPropsSorted.forEach(component => {
                                    const s = sizeMap.get(component.id)
                                    if (s) {
                                        (s.left as number) -= widest/2;
                                    }
                            })
                            left += widest/2
                            relativeLeft += widest/2
                            relativeTop = alignmentTop;
                            top = relativeTop;
                        }
                        else if (outerHa === HORIZONTAL_ALIGNMENT.LEFT) {
                            left += widest;
                            relativeLeft += widest
                            relativeTop = alignmentTop;
                            top = relativeTop;
                        }
                        else if (outerHa === HORIZONTAL_ALIGNMENT.RIGHT) {
                            componentPropsSorted.forEach(component => {
                                const s = sizeMap.get(component.id)
                                if (s) {
                                    (s.left as number) -= widest;
                                }
                            });
                            relativeTop = alignmentTop;
                            top = relativeTop;
                        }
                        else if (outerHa === HORIZONTAL_ALIGNMENT.STRETCH) {
                            componentPropsSorted.forEach(component => {
                                const s = sizeMap.get(component.id)
                                if (s) {
                                    (s.width as number) = (s.width as number)/2;
                                    test = (s.width as number)
                                }
                            });
                            relativeTop = alignmentTop;
                            top = relativeTop;
                            width = test - gaps.horizontalGap
                            if (relativeLeft === 0) {
                                relativeLeft += widest + gaps.horizontalGap
                            }
                                
                            else {
                                relativeLeft += relativeLeft
                            }
                                
                            left = relativeLeft
                        }
                    }

                    relativeTop += height + gaps.horizontalGap;
                }

                sizeMap.set(component.id,{
                    height: height,
                    width: width,
                    left: left,
                    top: top,
                    position: "absolute"
                });

            });

            if(reportSize && !style.width && !style.height){
                if(isRowOrientation)
                    reportSize(tallest, totalWidth);
                else
                reportSize(totalHeight, widest);
            }                     
        }

        return sizeMap;
    }, [layout, preferredCompSizes, reportSize, id, style, context.contentStore])

    return(
        <LayoutContext.Provider value={componentSizes}>
            <div style={{...style, position:"absolute"}}>
                {components}
            </div>
        </LayoutContext.Provider>
    )
}
export default FlowLayout