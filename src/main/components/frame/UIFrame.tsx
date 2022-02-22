import React, { FC, useMemo } from "react";
import COMPONENT_CLASSNAMES_V2 from "../COMPONENT_CLASSNAMES_V2";
import { Layout } from "../layouts";
import UIMenuBar from "../menubar/UIMenuBar";
import { panelGetStyle, parseMaxSize, parseMinSize, parsePrefSize } from "../util";
import { useComponents, useProperties } from "../zhooks";

const UIFrame: FC<any> = (props) => {
    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [children, components, componentSizes] = useComponents(props.id, props.className);

    const menuBarBaseProps = useMemo(() => children.find(component => component.className === COMPONENT_CLASSNAMES_V2.MENUBAR), [components]);

    return (
        <>
            <UIMenuBar {...menuBarBaseProps} />
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
                reportSize={() => { }}
                panelType="MobileLauncher"
                parent={props.parent} />
        </>
    )
}
export default UIFrame