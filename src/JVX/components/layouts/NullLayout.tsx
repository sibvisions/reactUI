import React, {CSSProperties, FC, useContext, useMemo, useState} from "react";
import {LayoutContext} from "../../LayoutContext";
import {ILayout} from "./Layout";
import {jvxContext} from "../../jvxProvider";
import Bounds from './models/Bounds';

const NullLayout: FC<ILayout> = (baseProps) => {
    const {
        components,
        preferredCompSizes,
        style,
        id,
        reportSize
    } = baseProps

    const [calculatedStyle, setCalculatedStyle] = useState<CSSProperties>();
    const context = useContext(jvxContext);

    const componentSizes = useMemo(() => {
        const sizeMap = new Map<string, CSSProperties>();
        const componentProps = context.contentStore.getChildren(id);
        if (preferredCompSizes) {
            let furthest = 0;
            let deepest = 0;

            componentProps.forEach(component => {
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

            if (style.width && style.height) {
                furthest = style.width as number;
                deepest = style.height as number;
            }

            if (reportSize && !style.width && !style.height)
                reportSize(deepest, furthest);

            setCalculatedStyle({height: deepest, width: furthest, left: style.left || 0, top: style.top || 0, position: 'relative'})
        }

        return sizeMap;
    },[preferredCompSizes, reportSize, id, style, context.contentStore]);

    return (
        <LayoutContext.Provider value={componentSizes}>
            <div style={calculatedStyle}>
                {components}
            </div>
        </LayoutContext.Provider>
    )
}
export default NullLayout;