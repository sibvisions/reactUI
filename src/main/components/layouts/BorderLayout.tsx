/* Copyright 2022 SIB Visions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import React, { CSSProperties, FC, useContext, useEffect, useMemo, useState } from "react";
import { LayoutContext } from "../../LayoutContext"
import { appContext, isDesignerVisible } from "../../contexts/AppProvider";
import { ILayout, isDesignerActive } from "./Layout";
import Gaps from "./models/Gaps";
import { getMinimumSize, getPreferredSize } from "../../util/component-util/SizeUtil";
import { useRunAfterLayout } from "../../hooks/components-hooks/useRunAfterLayout";
import Dimension from "../../util/types/Dimension";
import Margins from "./models/Margins";
import { LAYOUTS } from "../../util/types/designer/LayoutInformation";
import { BorderLayoutAssistant } from "../../util/types/designer/LayoutAssistant";

/** Type for borderLayoutComponents */
type BorderLayoutComponents = {
    north: Dimension,
    center: Dimension,
    west: Dimension,
    east: Dimension,
    south: Dimension
}

/**
 * The BorderLayout lay outs its components in a borderly fashion.
 * @param baseProps - the properties sent by the Layout component
 */
const BorderLayout: FC<ILayout> = (baseProps) => {
    /** Extract variables from baseprops */
    const {
        components,
        compSizes,
        style,
        reportSize,
        id,
        layout,
        className,
        panelType,
        name
    } = baseProps

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Current state of the calculatedStyle by the FormLayout */
    const [calculatedStyle, setCalculatedStyle] = useState<CSSProperties>();

    /** Margins of the BorderLayout */
    const margins = new Margins(layout.substring(layout.indexOf(',') + 1, layout.length).split(',').slice(0, 4));

    /** Horizontal- and vertical Gap */
    const gaps = new Gaps(layout.substring(layout.indexOf(',') + 1, layout.length).split(',').slice(4, 6));

    const runAfterLayout = useRunAfterLayout();

    const borderLayoutAssistant = useMemo(() => {
        if (context.designer && isDesignerVisible(context.designer)) {
            const compConstraintMap:Map<string, string> = new Map<string, string>();
            components.forEach(component => compConstraintMap.set(component.props.name, component.props.constraints));
            if (!context.designer.borderLayouts.has(name)) {
                context.designer.createBorderLayoutAssistant({
                    id: id,
                    name: name,
                    originalConstraints: compConstraintMap,
                    componentSizes: compSizes,
                    componentConstraints: new Map<string, string>(),
                    componentIndeces: [],
                    calculatedSize: null,
                    currentSize: null,
                    layoutType: LAYOUTS.BORDERLAYOUT
                })
            }
            else {
                context.designer.borderLayouts.get(name)!.layoutInfo.originalConstraints = compConstraintMap;
            }
            return context.designer.borderLayouts.get(name) as BorderLayoutAssistant;
        }
        else {
            return null;
        }
    }, [context.designer, context.designer?.isVisible]);

    const layoutInfo = useMemo(() => {
        if (borderLayoutAssistant) {
            return borderLayoutAssistant.layoutInfo;
        }
        else {
            return null;
        }
    }, [borderLayoutAssistant]);

    /** 
     * Returns a Map, the keys are the ids of the components, the values are the positioning and sizing properties given to the child components 
     * @returns a Map key: component ids, value style properties for components
     */
    const componentSizes = useMemo(() => {
        /** Map which contains component ids as key and positioning and sizing properties as value */
        const sizeMap = new Map<string, CSSProperties>();
        const children = context.contentStore.getChildren(id, className);

        let northUsed = false;
        let westUsed = false;
        let eastUsed = false;
        let southUsed = false;
        let hCompCount = 0;
        let vCompCount = 0;

        /** If compSizes is set (every component in this layout reported its sizes) */
        if(compSizes && children.size === compSizes.size && context.contentStore.getComponentById(id)?.visible !== false) {
            if (isDesignerActive(borderLayoutAssistant) && layoutInfo) {
                layoutInfo.componentConstraints.clear();
            }
            /** Preferred Sizes for BorderLayout areas */
            const prefConstraintSizes: BorderLayoutComponents = {
                center: {height: 0, width: 0},
                east: {height: 0, width: 0},
                west: {height: 0, width: 0},
                north: {height: 0, width: 0},
                south: {height: 0, width: 0}
            }

            /** Minimum Sizes for BorderLayout areas */
            const minConstraintSizes: BorderLayoutComponents = {
                center: {height: 0, width: 0},
                east: {height: 0, width: 0},
                west: {height: 0, width: 0},
                north: {height: 0, width: 0},
                south: {height: 0, width: 0}
            }

            /** Get the preferredSize for the areas of the BorderLayout */
            children.forEach(component => {
                if (component.visible !== false && component.constraints) {
                    if (isDesignerActive(borderLayoutAssistant) && layoutInfo) {
                        layoutInfo.componentConstraints.set(component.name, component.constraints);
                    }

                    const preferredSize = getPreferredSize(component, compSizes) || {height: 0, width: 0};
                    const minimumSize = getMinimumSize(component, compSizes);
                    if(component.constraints === "North") {
                        prefConstraintSizes.north = preferredSize;
                        minConstraintSizes.north = minimumSize;
                        northUsed = true;
                        vCompCount++;
                    }
                    else if(component.constraints === "South") {
                        prefConstraintSizes.south = preferredSize;
                        minConstraintSizes.south = minimumSize;
                        southUsed = true;
                        vCompCount++
                    }
                    else if(component.constraints === "East") {
                        prefConstraintSizes.east = preferredSize;
                        minConstraintSizes.east = minimumSize;
                        eastUsed = true;
                        hCompCount++;
                    }
                    else if(component.constraints === "West") {
                        prefConstraintSizes.west = preferredSize;
                        minConstraintSizes.west = minimumSize;
                        westUsed = true;
                        hCompCount++;
                    }   
                    else if(component.constraints === "Center") {
                        prefConstraintSizes.center = preferredSize;
                        minConstraintSizes.center = minimumSize;
                        vCompCount++;
                        hCompCount++;
                    }
                }
            });

            let addVGap = vCompCount > 0 ? (vCompCount - 1) * gaps.verticalGap : 0;
            let addHGap = hCompCount > 0 ? (hCompCount - 1) * gaps.horizontalGap : 0;

            // Build SizeMap

            /**
             * Returns the height of the components west, center and east
             * @returns - the height of the components west, center and east
             */
            const getCenterHeight = () => {
                /** The biggest preferredSize height of west, center and east */
                let centerHeight = Math.max(...[prefConstraintSizes.center.height, prefConstraintSizes.east.height, prefConstraintSizes.west.height]);
                /** If this layout has a set height by another layout, calculate the centerHeight */
                if (style.height) {
                    centerHeight = style.height as number - prefConstraintSizes.south.height - prefConstraintSizes.north.height - margins.marginTop - margins.marginBottom;
                }

                if (northUsed) {
                    centerHeight -= gaps.verticalGap;
                }

                if (southUsed) {
                    centerHeight -= gaps.verticalGap;
                }

                return centerHeight;
            }

            /**
             * Returns the width of the center component
             * @returns - the width of the center component
             */
            const getCenterWidth = () => {
                let centerWidth = prefConstraintSizes.center.width;
                /** If this layout has a set width by another layout, calculate the width of center */
                if (style.width) {
                    centerWidth = style.width as number - prefConstraintSizes.west.width - prefConstraintSizes.east.width - margins.marginLeft - margins.marginRight - 2 * gaps.horizontalGap;
                }

                if (westUsed) {
                    centerWidth -= gaps.horizontalGap;
                }

                if (eastUsed) {
                    centerWidth -= gaps.horizontalGap;
                }

                return centerWidth;
            }

            /**
             * Returns the left positioning of the east component
             * @returns - the left positioning of the east component
             */
            const getEastLeft = () => {
                /** Left of east is the sum of the widths of west and center */
                let eastLeft = prefConstraintSizes.west.width + prefConstraintSizes.center.width;
                /** If this layout has a set width by another layout, left of east is the width of the layout substracted by margin right and east width */
                if (style.width) {
                    eastLeft = style.width as number - prefConstraintSizes.east.width - margins.marginRight
                }

                return eastLeft;
            }

            /**
             * Returns the top positioning of the south component
             * @returns - the top positioning of the south component
             */
            const getSouthTop = () => {
                /** Top of south is the sum of the heights of north and center */
                let southTop = prefConstraintSizes.north.height + prefConstraintSizes.center.height;
                /** If this layout has a set width by another layout, top of south is the height of the layout substracted by south height */
                if (style.height) {
                    southTop = style.height as number - prefConstraintSizes.south.height - margins.marginBottom;
                }

                return southTop;
            }

            /** Sets the style properties for north component */
            const northCSS: CSSProperties = {
                position: "absolute",
                top: margins.marginTop,
                left: margins.marginLeft,
                /** If this layout has a set width by another layout, use the width */
                width: style.width as number - margins.marginLeft - margins.marginRight
                    || Math.max(...[
                        prefConstraintSizes.north.width,
                        prefConstraintSizes.center.width + prefConstraintSizes.east.width + prefConstraintSizes.west.width,
                        prefConstraintSizes.south.width
                    ]),
                height: prefConstraintSizes.north.height
            }

            /** Sets the style for the west component */
            const westCSS: CSSProperties = {
                position: "absolute",
                top: prefConstraintSizes.north.height + margins.marginTop + (northUsed ? gaps.verticalGap : 0),
                left: margins.marginLeft,
                width: prefConstraintSizes.west.width,
                height: getCenterHeight()
            }

            /** Sets the style for the center component */
            const centerCSS: CSSProperties = {
                position: "absolute",
                top: prefConstraintSizes.north.height + margins.marginTop + (northUsed ? gaps.verticalGap : 0),
                left: prefConstraintSizes.west.width + margins.marginLeft + (westUsed ? gaps.horizontalGap : 0),
                width: getCenterWidth(),
                height: getCenterHeight()
            }

            /** Sets the style for the east component */
            const eastCSS: CSSProperties = {
                position: "absolute",
                top: prefConstraintSizes.north.height + margins.marginTop + (northUsed ? gaps.verticalGap : 0),
                left: getEastLeft(),
                width: prefConstraintSizes.east.width,
                height: getCenterHeight()
            }

            /** Sets the style for the south component */
            const southCSS: CSSProperties = {
                position: "absolute",
                top: getSouthTop(),
                left: margins.marginLeft,
                width: style.width as number - margins.marginLeft - margins.marginRight 
                || Math.max(...[
                    prefConstraintSizes.north.width,
                    prefConstraintSizes.center.width + prefConstraintSizes.east.width + prefConstraintSizes.west.width,
                    prefConstraintSizes.south.width
                ]),
                height: prefConstraintSizes.south.height,
            }

            /** Build the sizemap with each component based on the constraints with their component id as key and css style as value */
            children.forEach(component => {
                if (component.visible !== false) {
                    if (component.constraints === "North") {
                        sizeMap.set(component.id, northCSS);
                    }
                    else if (component.constraints === "South") {
                        sizeMap.set(component.id, southCSS);
                    }
                    else if (component.constraints === "Center") {
                        sizeMap.set(component.id, centerCSS);
                    }
                    else if (component.constraints === "West") {
                        sizeMap.set(component.id, westCSS);
                    }
                    else if (component.constraints === "East") {
                        sizeMap.set(component.id, eastCSS);
                    }
                    else if (panelType === "DesktopPanel" && context.transferType === "full") {
                        sizeMap.set(component.id, { height: (style?.height as number) * 0.75, width: (style?.width as number) * 0.75 })
                    }
                }
            });
            const preferredWidth = Math.max(...[
                prefConstraintSizes.north.width,
                prefConstraintSizes.center.width + prefConstraintSizes.east.width + prefConstraintSizes.west.width,
                prefConstraintSizes.south.width
            ]) + margins.marginLeft + margins.marginRight + addHGap;

            const preferredHeight = prefConstraintSizes.north.height + prefConstraintSizes.south.height + Math.max(...[
                prefConstraintSizes.east.height,
                prefConstraintSizes.west.height,
                prefConstraintSizes.center.height
            ]) + margins.marginTop + margins.marginBottom + addVGap;

            const minimumWidth = Math.max(...[
                Math.max(...[minConstraintSizes.north.width, minConstraintSizes.south.width]),
                minConstraintSizes.center.width + minConstraintSizes.east.width, minConstraintSizes.west.width
            ]) + margins.marginLeft + margins.marginRight + addHGap;

            const minimumHeight = Math.max(...[
                Math.max(...[minConstraintSizes.west.height, minConstraintSizes.east.height]), minConstraintSizes.center.height
            ]) + minConstraintSizes.north.height + minConstraintSizes.south.height + margins.marginTop + margins.marginBottom + addVGap;

            const cssWidth = Math.max(...[
                Math.max(...[northCSS.width as number, southCSS.width as number]),
                ((centerCSS.width as number) + (eastCSS.width as number) + (westCSS.width as number))])
                + margins.marginLeft + margins.marginRight + addHGap;

            const cssHeight = Math.max(...[
                Math.max(...[(westCSS.height as number), (eastCSS.height as number)]), (centerCSS.height as number)
            ]) + (northCSS.height as number) + (southCSS.height as number) + margins.marginTop + margins.marginBottom + addVGap;

            if (reportSize) {
                runAfterLayout(() => {
                    if (baseProps.preferredSize) {
                        if (isDesignerActive(borderLayoutAssistant) && layoutInfo) {
                            layoutInfo.calculatedSize = { height: baseProps.preferredSize.height, width: baseProps.preferredSize.width };
                        }
                        reportSize({ height: baseProps.preferredSize.height, width: baseProps.preferredSize.width }, { height: minimumHeight, width: minimumWidth })
                    }
                    else {
                        if (isDesignerActive(borderLayoutAssistant) && layoutInfo) {
                            layoutInfo.calculatedSize = { height: preferredHeight, width: preferredWidth };
                        }
                        reportSize({ height: preferredHeight, width: preferredWidth }, { height: minimumHeight, width: minimumWidth });
                    }
                })
            }
            
            let layoutSize:Dimension; 
            if (baseProps.panelType === "DesktopPanel") {
                layoutSize = { height: style.height as number, width: style.width as number };
            }
            else if (baseProps.popupSize) {
                layoutSize = { height: baseProps.popupSize.height, width: baseProps.popupSize.width };
            }
            else {
                layoutSize = { height: cssHeight, width: cssWidth };
            }

            if (isDesignerActive(borderLayoutAssistant) && layoutInfo) {
                layoutInfo.currentSize = layoutSize;
            }

            setCalculatedStyle({ height: layoutSize.height, width: layoutSize.width, position: 'relative' });
            
        }
        return sizeMap;
    }, [compSizes, style.width, style.height, reportSize, id, context.contentStore, components, 
        margins.marginBottom, margins.marginLeft, margins.marginRight, margins.marginTop]);

    useEffect(() => {
        if (context.designer && isDesignerVisible(context.designer) && context.designer.borderLayouts.has(name)) {
            context.designer.borderLayouts.get(name)!.layoutInfo.componentSizes = compSizes;
        }
    }, [compSizes, context.designer]);

    return(
        /** Provide the allowed sizes of the children as a context */
        <LayoutContext.Provider value={componentSizes}>
            <div className="rc-layout-element" data-layout="border" data-name={name} style={calculatedStyle}>
                {components}
            </div>
        </LayoutContext.Provider>
    )
}
export default BorderLayout