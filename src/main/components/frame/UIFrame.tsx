import React, { FC, useCallback, useContext, useMemo, useState } from "react";
import { appContext } from "../../AppProvider";
import COMPONENT_CLASSNAMES from "../COMPONENT_CLASSNAMES";
import COMPONENT_CLASSNAMES_V2 from "../COMPONENT_CLASSNAMES_V2";
import { Layout } from "../layouts";
import UIMenuBar from "../menubar/UIMenuBar";
import { Dimension, panelGetStyle, parseMaxSize, parseMinSize, parsePrefSize } from "../util";
import { useComponents } from "../zhooks";

const UIFrame: FC<any> = (props) => {
    const context = useContext(appContext);
    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [children, components, componentSizes] = useComponents(props.id, props.className);

    const menuBarBaseProps = useMemo(() => context.contentStore.getMenuBar(props.id), [children]);

    const [menuBarSize, setMenuBarSize] = useState<Dimension>({ width: 0, height: 0 });

    const [toolBarSize, setToolBarSize] = useState<Dimension>({ width: 0, height: 0 });

    const menuBarSizeCallback = useCallback((size:Dimension) => setMenuBarSize(size), []);

    const toolBarSizeCallback = useCallback((size:Dimension) => {
        if (toolBarSize.height !== size.height || toolBarSize.width !== size.width) {
            setToolBarSize(size)
        }
    }, [toolBarSize]);

    const adjustedStyle = useMemo(() => {
        const styleCopy = {...props.layoutStyle};
        styleCopy.height = (props.layoutStyle.height as number) - menuBarSize.height - toolBarSize.height;
        return styleCopy;
    }, [menuBarSize, toolBarSize, props.layoutStyle]);

    return (
        <div style={{ visibility: componentSizes ? undefined : "hidden" }}>
            <UIMenuBar {...menuBarBaseProps} sizeCallback={menuBarSizeCallback} currentSize={menuBarSize} />
            <div className="rc-frame-toolbar">
                <Layout
                    id={props.id + "-frame-tb"}
                    className="Frame-Toolbar"
                    layoutData={""}
                    layout={"FlowLayout,0,0,0,0,0,0,0,0,0,3,true"}
                    compSizes={componentSizes ? new Map([...componentSizes].filter(comp => context.contentStore.getComponentById(comp[0])?.className === COMPONENT_CLASSNAMES.TOOLBAR)) : undefined}
                    components={components.filter(comp => comp.props.className === COMPONENT_CLASSNAMES.TOOLBAR)}
                    style={{}}
                    reportSize={toolBarSizeCallback}
                    panelType="Frame-Toolbar"
                    parent={props.id} />
            </div>
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
                style={panelGetStyle(false, adjustedStyle)}
                reportSize={() => { }}
                parent={props.parent} />
        </div>
    )
}
export default UIFrame