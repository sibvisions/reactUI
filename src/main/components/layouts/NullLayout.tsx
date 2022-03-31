import React, { CSSProperties, FC, useContext, useMemo, useState } from "react";
import { appContext } from "../../AppProvider";
import { LayoutContext } from "../../LayoutContext";
import { ILayout, Bounds } from ".";

/**
 * The NullLayout allows to layout the components in an absolute manner
 * @param baseProps - the properties sent by the Layout component
 */
const NullLayout: FC<ILayout> = (baseProps) => {
    /** Extract variables from baseprops */
    const {
        components,
        compSizes,
        style,
        id,
        reportSize,
        className
    } = baseProps

    /** Current state of the calculatedStyle by the FormLayout */
    const [calculatedStyle, setCalculatedStyle] = useState<CSSProperties>();
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** 
     * Returns a Map, the keys are the ids of the components, the values are the positioning and sizing properties given to the child components 
     * @returns a Map key: component ids, value style properties for components
     */
    const componentSizes = useMemo(() => {
        /** Map which contains component ids as key and positioning and sizing properties as value */
        const sizeMap = new Map<string, CSSProperties>();

        const children = context.contentStore.getChildren(id, className);

        /** If compSizes is set (every component in this layout reported its preferred size) */
        if (compSizes && children.size === compSizes.size && context.contentStore.getComponentById(id)?.visible !== false) {
            /** horizontal position of the component most to the right*/
            let furthest = 0;
            /** vertical position of the component most to the bottom */
            let deepest = 0;

            /** 
             * Get deepest and furthest position for preferredSize
             * and build the sizeMap with each component based on the constraints with their component id as key and css style as value
             */
            children.forEach(component => {
                const compBounds = new Bounds((component.bounds as string).split(','));
                if (compBounds.top + compBounds.height > deepest)
                    deepest = compBounds.top + compBounds.height;
                if (compBounds.left + compBounds.width > furthest)
                    furthest = compBounds.left + compBounds.width

                sizeMap.set(component.id, {
                    height: compBounds.height,
                    width: compBounds.width,
                    left: compBounds.left,
                    top: compBounds.top,
                    position: 'absolute'
                });
            });

            /** If there is a size set by the parent layout, use it */
            if (style.width && style.height) {
                furthest = style.width as number;
                deepest = style.height as number;
            }

            /** If reportSize is set and the layout has not received a size by their parent layout (if possible) or the size of the layout changed, report the size */
            if ((reportSize && !style.width && !style.height) || (deepest !== style.height || furthest !== style.width))
                reportSize(deepest, furthest);
            /** Set the state of the calculated Style */
            setCalculatedStyle({height: deepest, width: furthest, left: style.left || 0, top: style.top || 0, position: 'relative'})
        }

        return sizeMap;
    },[compSizes, reportSize, id, style, context.contentStore]);

    return (
        /** Provide the allowed sizes of the children as a context */
        <LayoutContext.Provider value={componentSizes}>
            <div style={calculatedStyle}>
                {components}
            </div>
        </LayoutContext.Provider>
    )
}
export default NullLayout;