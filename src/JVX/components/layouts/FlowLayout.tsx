import React, {CSSProperties, FC, useContext, useMemo} from "react";
import {LayoutContext} from "../../LayoutContext";
import Gaps from "./models/Gaps";
import {ILayout} from "./Layout";
import {jvxContext} from "../../jvxProvider";
import {HORIZONTAL_ALIGNMENT, VERTICAL_ALIGNMENT} from "./models/ALIGNMENT";
import {ORIENTATION} from "./models/Anchor";
import {FlowGrid} from "./models/FlowGrid";
import Size from "../util/Size";

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

        const componentPropsSorted = new Map([...componentProps.entries()].sort((a, b) => {return (a[1].indexOf as number) - (b[1].indexOf as number)}))

        if(preferredCompSizes){

            const getAlignmentFactor = (alignment:number) => {
                switch (alignment) {
                    case HORIZONTAL_ALIGNMENT.LEFT:
                    case VERTICAL_ALIGNMENT.TOP:
                        return 0;
                    case HORIZONTAL_ALIGNMENT.CENTER:
                        return 0.5;
                    case HORIZONTAL_ALIGNMENT.RIGHT:
                    case VERTICAL_ALIGNMENT.BOTTOM:
                        return 1;
                    default:
                        console.error('Invalid alignment: ' + alignment);
                        return 0;
                }
            }

            const calculateGrid = ():FlowGrid => {
                let calcHeight = 0;
                let calcWidth = 0;

                let width = 0;
                let height = 0;

                let anzRows = 1;
                let anzCols = 1;

                let bFirst = true;

                componentPropsSorted.forEach(component => {
                    if (component.visible !== false) {
                        const prefSize = preferredCompSizes.get(component.id) || { width: 0, height: 0 };

                        if (isRowOrientation) {
                            if (!bFirst)
                                calcWidth += gaps.horizontalGap;
                            calcWidth += prefSize.width;
                            height = Math.max(height, prefSize.height);

                            if (!bFirst && autoWrap && (style.width as number) > 0 && calcWidth > (style.width as number)) {
                                calcWidth = prefSize.width;
                                anzRows++;
                            }
                            else if (bFirst)
                                bFirst = false;
                            width = Math.max(width, calcWidth);
                        }
                        else {
                            if (!bFirst)
                                calcHeight += gaps.verticalGap;
                            calcHeight += prefSize.height;
                            width = Math.max(width, prefSize.width);

                            if (!bFirst && autoWrap && (style.height as number) > 0 && calcHeight > (style.height as number)) {
                                calcHeight = prefSize.height;
                                anzCols++;
                            }
                            else if (bFirst)
                                bFirst = false;
                            height = Math.max(height, calcHeight);
                        }
                    }
                });
                const grid:FlowGrid = {columns: anzCols, rows: anzRows, gridWidth: width, gridHeight: height}
                return grid;
            }

            const flowLayoutInfo = calculateGrid();
            const prefSize:Size = {width: flowLayoutInfo.gridWidth * flowLayoutInfo.columns + gaps.horizontalGap * (flowLayoutInfo.columns-1),
                                   height: flowLayoutInfo.gridHeight * flowLayoutInfo.rows + gaps.verticalGap * (flowLayoutInfo.rows-1)};
            let left:number;
            let width:number;

            if (outerHa === HORIZONTAL_ALIGNMENT.STRETCH) {
                left = 0;
                width = (style.width as number);
            }
            else {
                left = ((style.width as number) - prefSize.width) * getAlignmentFactor(outerHa);
                width = prefSize.width;
            }

            let top:number;
            let height:number;

            if (outerVa === VERTICAL_ALIGNMENT.STRETCH) {
                top = 0;
                height = (style.height as number);
            }
            else {
                top = ((style.height as number) - prefSize.height) * getAlignmentFactor(outerVa);
                height = prefSize.height;
            }

            let fW = Math.max(1, width);
            let fPW = Math.max(1, prefSize.width);
            let fH = Math.max(1, height);
            let fPH = Math.max(1, prefSize.height);
            let x = 0;
            let y = 0;

            let bFirst = true;
            componentPropsSorted.forEach(component => {
                if (component.visible !== false) {
                    const size = preferredCompSizes.get(component.id) || {width: 0, height: 0};

                    if (isRowOrientation) {
                        if (!bFirst && autoWrap && (style.width as number) > 0 && x + size.width > (style.width as number)) {
                            x = 0;
                            y += (flowLayoutInfo.gridHeight + gaps.verticalGap) * fH / fPH;
                        }
                        else if (bFirst)
                            bFirst = false;

                        if (innerAlignment === VERTICAL_ALIGNMENT.STRETCH) {
                            sizeMap.set(component.id, {
                                left: left + x * fW / fPW, 
                                top: top + y, 
                                width: size.width * fW / fPW, 
                                height: flowLayoutInfo.gridHeight * fH / fPH,
                                position: "absolute"}
                            );
                        }
                        else {
                            sizeMap.set(component.id, {
                                left: left + x * fW / fPW,
                                top: top + y + ((flowLayoutInfo.gridHeight - size.height) * getAlignmentFactor(innerAlignment)) * fH / fPH,
                                width: size.width * fW / fPW,
                                height: size.height * fH / fPH,
                                position: "absolute"}
                            );
                        }

                        x += size.width + gaps.horizontalGap;
                    }
                    else {
                        if (!bFirst && autoWrap && (style.height as number) > 0 && y + size.height > (style.height as number)) {
                            y = 0;
                            x += (flowLayoutInfo.gridWidth + gaps.horizontalGap) * fW / fPW;
                        }
                        else if (bFirst)
                            bFirst = false;
                        
                        if (innerAlignment === HORIZONTAL_ALIGNMENT.STRETCH) {
                            sizeMap.set(component.id, {
                                left: left + x,
                                top: top + y * fH / fPH,
                                width: flowLayoutInfo.gridWidth * fW / fPW,
                                height: size.height * fH / fPH,
                                position: "absolute"}
                            );
                        }
                        else {
                            sizeMap.set(component.id, {
                                left: left + x + ((flowLayoutInfo.gridWidth - size.width) * getAlignmentFactor(innerAlignment)) * fW / fPW,
                                top: top + y * fH / fPH,
                                width: size.width * fW / fPW,
                                height: size.height * fH / fPH,
                                position: "absolute"}
                            );
                        }

                        y += size.height + gaps.verticalGap
                    }
                }
            })

            if(reportSize && !style.width && !style.height){
                reportSize(flowLayoutInfo.gridHeight, flowLayoutInfo.gridWidth);
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