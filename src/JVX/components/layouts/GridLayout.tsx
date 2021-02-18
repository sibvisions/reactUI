/** React imports */
import React, {CSSProperties, FC, useContext, useMemo, useState} from "react";

/** Other imports */
import {LayoutContext} from "../../LayoutContext";
import Gaps from "./models/Gaps";
import {ILayout} from "./Layout";
import {jvxContext} from "../../jvxProvider";
import CellConstraints from "./models/CellConstraints"
import Margins from "./models/Margins";
import GridSize from "./models/GridSize";
import Size from "../util/Size";

/**
 * The GridLayout is a component that lays out a container's
 * components in a rectangular grid.
 * @param baseProps - the properties sent by the Layout component
 */
const GridLayout: FC<ILayout> = (baseProps) => {
    /** Extract variables from baseprops */
    const {
        components,
        layout,
        preferredCompSizes,
        style,
        id,
        reportSize
    } = baseProps

    /** Current state of the calculatedStyle by the FormLayout */
    const [calculatedStyle, setCalculatedStyle] = useState<CSSProperties>();
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);

    /** 
     * Returns a Map, the keys are the ids of the components, the values are the positioning and sizing properties given to the child components 
     * @returns a Map key: component ids, value style properties for components
     */
    const componentSizes = useMemo(() => {
        /** Map which contains component ids as key and positioning and sizing properties as value */
        const sizeMap = new Map<string, CSSProperties>();
        /** Margins of layout */
        const margins = new Margins(layout.substring(layout.indexOf(',') + 1, layout.length).split(',').slice(0, 4));
        /** Gaps between the components */
        const gaps = new Gaps(layout.substring(layout.indexOf(',') + 1, layout.length).split(',').slice(4, 6));
        /** GridSize of the layout */
        const gridSize = new GridSize(layout.substring(layout.indexOf(',') + 1, layout.length).split(',').slice(6, 8));

        /** Gets the Childcomponents of the layout */
        const children = context.contentStore.getChildren(id);

        /** If preferredCompSizes is set (every component in this layout reported its preferred size) */
        if (preferredCompSizes) {
            /** The widest single grid of all components */
            let widest = 0;
            /** The tallest single grid of all components */
            let tallest = 0;

            /** Totalwidth of the layout */
            let totalWidth = 0;
            /** Totalheight of the layout */
            let totalHeight = 0;
            
            children.forEach(component => {
                const componentConstraints = new CellConstraints(component.constraints);
                const prefSize = preferredCompSizes.get(component.id) || {width: 0, height: 0};
                /** Calculate how wide one single grid would be for the component based on the preferred width and how many grids the component is wide */
                const widthOneField = Math.ceil(prefSize.width / componentConstraints.gridWidth);
                /** Calculate how tall one single grid would be for the component based on the preferred height and how many grids the component is tall */
                const heightOneField = Math.ceil(prefSize.height / componentConstraints.gridHeight);
                if (widthOneField > widest)
                    widest = widthOneField;
                if (heightOneField > tallest)
                    tallest = heightOneField;
            });

            /** If there is a size set by parent layout use that */
            if (style.width && style.height) {
                totalWidth = style.width as number - margins.marginLeft - margins.marginRight;
                totalHeight = style.height as number - margins.marginTop - margins.marginBottom;
            }
            /** Or take the tallest/widest single grid times the rows/columns minus margins */
            else {
                totalWidth = widest * gridSize.columns - margins.marginLeft - margins.marginRight;
                totalHeight = tallest * gridSize.rows - margins.marginTop - margins.marginBottom;
            }

            const fieldSize:Size = {width: totalWidth/gridSize.columns, height: totalHeight/gridSize.rows};

            /** Calculate the sizes and build the sizeMap with each component based on the constraints with their component id as key and css style as value */
            children.forEach(component => {
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
            /** If reportSize is set and the layout has not received a size by their parent layout (if possible) report the size */
            if (reportSize && !style.width && !style.height)
                reportSize(totalHeight, totalWidth);
            /** Set the state of the calculated Style */
            setCalculatedStyle({height: totalHeight, width: totalWidth, left: style.left || margins.marginLeft, top: style.top || margins.marginTop, position: 'relative'});
        }

        return sizeMap
    },[layout, preferredCompSizes, reportSize, id, style, context.contentStore])

    return (
        /** Provide the allowed sizes of the children as a context */
        <LayoutContext.Provider value={componentSizes}>
            <div style={calculatedStyle}>
                {components}
            </div>
        </LayoutContext.Provider>
    )

}
export default GridLayout;