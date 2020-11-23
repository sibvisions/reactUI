import React, {CSSProperties, FC, useContext, useMemo, useState} from "react";
import {LayoutContext} from "../../LayoutContext";
import Gaps from "./models/Gaps";
import {ILayout} from "./Layout";
import {jvxContext} from "../../jvxProvider";
import CellConstraints from "./models/CellConstraints"
import Margins from "./models/Margins";
import GridSize from "./models/GridSize";
import Size from "../util/Size";

const GridLayout: FC<ILayout> = (baseProps) => {

    const {
        components,
        layout,
        preferredCompSizes,
        style,
        id,
        reportSize
    } = baseProps

    const [calculatedStyle, setCalculatedStyle] = useState<CSSProperties>()
    const context = useContext(jvxContext);

    const componentSizes = useMemo(() => {
        const sizeMap = new Map<string, CSSProperties>();
        const margins = new Margins(layout.substring(layout.indexOf(',') + 1, layout.length).split(',').slice(0, 4));
        const gaps = new Gaps(layout.substring(layout.indexOf(',') + 1, layout.length).split(',').slice(4, 6));
        const gridSize = new GridSize(layout.substring(layout.indexOf(',') + 1, layout.length).split(',').slice(6, 8));

        const componentProps = context.contentStore.getChildren(id);

        if (preferredCompSizes) {
            let widest = 0;
            let tallest = 0;

            let totalWidth = 0;
            let totalHeight = 0;
            
            componentProps.forEach(component => {
                const componentConstraints = new CellConstraints(component.constraints);
                const prefSize = preferredCompSizes.get(component.id) || {width: 0, height: 0};
                const widthOneField = Math.ceil(prefSize.width / componentConstraints.gridWidth);
                const heightOneField = Math.ceil(prefSize.height / componentConstraints.gridHeight);
                if (widthOneField > widest)
                    widest = widthOneField;
                if (heightOneField > tallest)
                    tallest = heightOneField;
            });

            if (style.width && style.height) {
                totalWidth = style.width as number - margins.marginLeft - margins.marginRight;
                totalHeight = style.height as number - margins.marginTop - margins.marginBottom;
            }
            else {
                totalWidth = widest * gridSize.columns - margins.marginLeft - margins.marginRight;
                totalHeight = tallest * gridSize.rows - margins.marginTop - margins.marginBottom;
            }

            const fieldSize:Size = {width: totalWidth/gridSize.columns, height: totalHeight/gridSize.rows};

            componentProps.forEach(component => {
                const componentConstraints = new CellConstraints(component.constraints);

                const calculatedWidth = componentConstraints.gridWidth * (fieldSize.width - (gaps.horizontalGap / componentConstraints.gridWidth - gaps.horizontalGap / gridSize.columns));
                const calculatedLeft = componentConstraints.gridX * (fieldSize.width - (gaps.horizontalGap - gaps.horizontalGap / gridSize.columns) + gaps.horizontalGap);
                const calculatedHeight = componentConstraints.gridHeight * (fieldSize.height - (gaps.verticalGap / componentConstraints.gridHeight - gaps.verticalGap / gridSize.rows));
                const calculatedTop = componentConstraints.gridY * (fieldSize.height - (gaps.verticalGap - gaps.verticalGap / gridSize.rows) + gaps.verticalGap);
                sizeMap.set(component.id, {
                    height: calculatedHeight,
                    width: calculatedWidth,
                    left: calculatedLeft,
                    top: calculatedTop,
                    position: "absolute"
                });
            });
            if (reportSize && !style.width && !style.height)
                reportSize(totalHeight, totalWidth);
            
            setCalculatedStyle({height: totalHeight, width: totalWidth, left: style.left || margins.marginLeft, top: style.top || margins.marginTop, position: 'relative'});
        }

        return sizeMap
    },[layout, preferredCompSizes, reportSize, id, style, context.contentStore])

    return (
        <LayoutContext.Provider value={componentSizes}>
            <div style={{...calculatedStyle}}>
                {components}
            </div>
        </LayoutContext.Provider>
    )

}
export default GridLayout