import React, { CSSProperties, FC, useCallback, useContext, useMemo, useState } from "react";
import { appContext } from "../../AppProvider";
import COMPONENT_CLASSNAMES from "../COMPONENT_CLASSNAMES";
import { IWindow } from "../launcher/UIMobileLauncher";
import { Layout } from "../layouts";
import UIMenuBar from "../menubar/UIMenuBar";
import UIToolbar from "../toolbar/UIToolbar";
import { Dimension, panelGetStyle, parseMaxSize, parseMinSize, parsePrefSize } from "../util";
import { useComponents } from "../zhooks";

export interface IFrame extends IWindow {
    frameStyle?: CSSProperties
}

const UIFrame: FC<IFrame> = (props) => {
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
        const styleCopy:CSSProperties = {...props.frameStyle};
        if (props.frameStyle) {
            styleCopy.height = (props.frameStyle.height as number) - menuBarSize.height - toolBarSize.height;
        }
        return styleCopy;
    }, [menuBarSize, toolBarSize, props.frameStyle]);

    return (
        <div style={{ visibility: componentSizes ? undefined : "hidden" }}>
            <UIMenuBar {...menuBarBaseProps} sizeCallback={menuBarSizeCallback} currentSize={menuBarSize} />
            <UIToolbar id={props.id + "-frame-toolbar"} sizeCallback={toolBarSizeCallback} />
            {/* <div className="rc-frame-toolbar">
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
            </div> */}
            <Layout
                id={props.id}
                className={props.className}
                layoutData={props.layoutData}
                layout={props.layout}
                preferredSize={parsePrefSize(props.preferredSize)}
                minimumSize={parseMinSize(props.minimumSize)}
                maximumSize={parseMaxSize(props.maximumSize)}
                compSizes={componentSizes ? new Map([...componentSizes].filter(comp => context.contentStore.getComponentById(comp[0])?.["~additional"] !== true)) : undefined}
                components={components.filter(comp => comp.props["~additional"] !== true)}
                style={panelGetStyle(false, adjustedStyle)}
                reportSize={() => { }}
                parent={props.parent} />
        </div>
    )
}
export default UIFrame