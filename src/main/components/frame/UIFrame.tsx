import React, { CSSProperties, FC, useCallback, useMemo, useState } from "react";
import { createCloseFrameRequest } from "../../factories/RequestFactory";
import { REQUEST_ENDPOINTS } from "../../request";
import BaseComponent from "../BaseComponent";
import { parseIconData } from "../compprops";
import { IWindow } from "../launcher/UIMobileLauncher";
import { Layout } from "../layouts";
import UIMenuBar from "../menubar/UIMenuBar";
import UIToolbar from "../toolbar/UIToolbar";
import { showTopBar } from "../topbar/TopBar";
import { concatClassnames, Dimension, panelGetStyle, parseMaxSize, parseMinSize, parsePrefSize } from "../util";
import { ComponentSizes, useComponents, useConstants } from "../zhooks";
import { isFAIcon } from "../zhooks/useButtonMouseImages";

export interface IFrame extends IWindow {
    frameStyle?: CSSProperties,
    internal?: boolean
    sizeCallback?:Function,
    iconImage?:string,
    children?: BaseComponent[],
    components?: any,
    compSizes?: Map<string, ComponentSizes>
}

const UIFrame: FC<IFrame> = (props) => {
    const [context, topbar] = useConstants();

    const menuBarProps = useMemo(() => context.contentStore.getMenuBar(props.id), [props.children]);

    const hasToolBars = useMemo(() => context.contentStore.hasToolBars(props.id), [props.children]);

    const [menuBarSize, setMenuBarSize] = useState<Dimension>({ width: 0, height: 0 });

    const [toolBarSize, setToolBarSize] = useState<Dimension>({ width: 0, height: 0 });

    const menuBarSizeCallback = useCallback((size:Dimension) => setMenuBarSize(size), []);

    const toolBarSizeCallback = useCallback((size:Dimension) => {
        if (toolBarSize.height !== size.height || toolBarSize.width !== size.width) {
            setToolBarSize(size)
        }
    }, [toolBarSize]);

    const iconProps = useMemo(() => parseIconData(undefined, props.iconImage), [props.iconImage]);

    const adjustedStyle = useMemo(() => {
        const styleCopy:CSSProperties = {...props.frameStyle};
        if (props.frameStyle) {
            styleCopy.height = (props.frameStyle.height as number) - menuBarSize.height - toolBarSize.height;
        }
        return styleCopy;
    }, [menuBarSize, toolBarSize, props.frameStyle]);

    return (
        <div style={{ visibility: props.compSizes ? undefined : "hidden" }}>
            {props.internal &&
                <div className="rc-frame-header">
                    {props.iconImage && 
                        isFAIcon(iconProps.icon) 
                        ?
                            <i className={concatClassnames(iconProps.icon, "rc-frame-header-icon")} style={{ fontSize: iconProps.size?.height, color: iconProps.color }} />
                        :
                            <img src={context.server.RESOURCE_URL + iconProps.icon} className="rc-frame-header-icon" style={{ height: iconProps.size?.height, width: iconProps.size?.width }} />
                    }
                    <span className="rc-frame-header-title">{props.title}</span>
                    <button
                        className="rc-frame-header-close-button pi pi-times"
                        onClick={() => {
                            const closeReq = createCloseFrameRequest();
                            closeReq.componentId = props.name;
                            showTopBar(context.server.sendRequest(closeReq, REQUEST_ENDPOINTS.CLOSE_FRAME), topbar);
                        }}
                    />
                </div>
            }
            {menuBarProps && <UIMenuBar {...menuBarProps} sizeCallback={menuBarSizeCallback} currentSize={menuBarSize} />}
            {hasToolBars && <UIToolbar id={props.id + "-frame-toolbar"} sizeCallback={toolBarSizeCallback} />}
            <Layout
                id={props.id}
                className={props.className}
                layoutData={props.layoutData}
                layout={props.layout}
                preferredSize={parsePrefSize(props.preferredSize)}
                minimumSize={parseMinSize(props.minimumSize)}
                maximumSize={parseMaxSize(props.maximumSize)}
                compSizes={props.compSizes}
                components={props.components}
                style={panelGetStyle(false, adjustedStyle)}
                reportSize={props.sizeCallback ? props.sizeCallback : () => {}}
                parent={props.parent} />
        </div>
    )
}
export default UIFrame