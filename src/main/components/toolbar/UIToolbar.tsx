import React, { FC, useCallback } from "react";
import { Layout } from "../layouts";
import { Dimension, panelGetStyle, parseMaxSize, parseMinSize, parsePrefSize } from "../util";
import { useComponents, useProperties } from "../zhooks";

/**
 * This component displays a menubar for a frame
 * @param baseProps - the base properties received from the frame
 */
const UIToolbar: FC<any> = (baseProps) => {
    const [props] = useProperties<any>(baseProps.id, baseProps);

    const [children, components, componentSizes] = useComponents(props.id, props.className);

    

    const reportSize = useCallback((prefSize:Dimension) => {
        // + 1 because of border
        if (props.currentSize.height !== prefSize.height + 1 && props.currentSize.width !== prefSize.width) {
            baseProps.sizeCallback({ height: prefSize.height + 1, width: prefSize.width });
        }
    }, []);

    return (
        <div id={props.name} className="rc-frame-toolbar">
            <Layout
                id={props.id}
                className={props.className}
                layoutData={props.layoutData}
                layout={props.layout}
                preferredSize={parsePrefSize(props.preferredSize)}
                minimumSize={parseMinSize(props.minimumSize)}
                maximumSize={parseMaxSize(props.maximumSize)}
                compSizes={componentSizes}
                components={components}
                style={panelGetStyle(false, props.layoutStyle)}
                reportSize={reportSize}
                parent={props.parent} />
        </div>
    )
}
export default UIToolbar