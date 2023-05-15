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

import React, { CSSProperties, FC, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import _ from "underscore";
import { createBoundsRequest } from "../../factories/RequestFactory";
import { IWindow } from "../launcher/UIMobileLauncher";
import { OpenFrameContext } from "../panels/desktopPanel/UIDesktopPanelFull";
import { checkSizes, sendOnLoadCallback } from "../../util/server-util/SendOnLoadCallback";
import UIFrame from "./UIFrame";
import useComponents from "../../hooks/components-hooks/useComponents";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../util/component-util/SizeUtil";
import useEventHandler from "../../hooks/event-hooks/useEventHandler";
import Dimension from "../../util/types/Dimension";
import REQUEST_KEYWORDS from "../../request/REQUEST_KEYWORDS";
import { concatClassnames } from "../../util/string-util/ConcatClassnames";
import Bounds from "../layouts/models/Bounds";
import { IComponentConstants } from "../BaseComponent";

export interface IInternalFrame extends IWindow, IComponentConstants {
    iconifiable?: boolean
    maximizable?:boolean
    closable?: boolean
    pack?: boolean
    resizable?: boolean
    centerRelativeTo?: string
    toFront?: boolean
    toBack?: boolean
    dispose?: boolean
}

/**
 * This component displays an internal window which can be moved and resized (if resizable is true).
 * @param baseProps - the base properties of this component sent by the server.
 */
const UIInternalFrame: FC<IInternalFrame> = (props) => {
    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [children, components, componentSizes] = useComponents(props.id, props.className);
    
    /** Context which Frame is currently in front */
    const frameContext = useContext(OpenFrameContext);

    /** From the layoutstyle adjusted frame style, when measuring frame removes header from height */
    const [frameStyle, setFrameStyle] = useState<CSSProperties>();

    /** The size which is displayed when the "pack" is true, layoutStyle gets ignored and the preferred-size is shown */
    const [packSize, setPackSize] = useState<CSSProperties>();

    /** Extracting onLoadCallback and id from baseProps */
    const { onLoadCallback, id } = props;

    /** Flag, true, if framestyle needs to be initially set */
    const initFrame = useRef<boolean>(true);

    /** The bounds of the InternalFrame */
    const bounds = useMemo(() => props.bounds ? new Bounds(props.bounds.split(",")) : null, [props.bounds]);

    /** Returns the Element which this InternalFrame is centered to, or undefined if it wasn't found */
    const getCenterRelativeElem = useCallback(() => {
        if (props.centerRelativeTo) {
            const relativeComp = props.context.contentStore.getComponentById(props.centerRelativeTo);
            if (relativeComp) {
                if (relativeComp.parent?.includes("IF") && !frameContext.tabMode) {
                    return document.getElementById(relativeComp.name)?.closest(".rc-frame") as HTMLElement
                }
                else {
                    return document.getElementById(relativeComp.name);
                }
            }
        }
        return undefined;
    }, [props.centerRelativeTo]);

    /** Flag, true, if the InternalFrame still needs to be centered */
    const [positionFlag, setPositionFlag] = useState<boolean>(true);

    /** The current position of the InternalFrame on the screen */
    const [framePosition, setFramePosition] = useState<{x: number, y: number}>({ x: bounds ? bounds.left : 0, y: bounds ? bounds.top : 0 });

    /** Reference for the Rnd element */
    const rndRef = useRef<Rnd>(null);

    /** A timer to send bounds after dragging the InternalFrame */
    const boundsTimer = useRef<any>(null);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if (rndRef.current) {
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), rndRef.current.resizableElement.current, onLoadCallback)
        }
    }, [onLoadCallback]);

    /** Adds eventHandler to call the frameContext callback on mouse-down to tell the DesktopPanel that this frame is at front */
    useEventHandler(rndRef.current?.resizableElement.current ? rndRef.current.resizableElement.current : undefined, "mousedown", () => frameContext.openFramesCallback(props.name, true));

    /**
     * Sends a bounds-request to the server
     * @param size - the size of the InternalFrame
     */
     const sendBoundsRequest = useCallback((boundsObj: {width?: number, height?: number, x?: number, y?:number}) => {
        const boundsReq = createBoundsRequest();
        boundsReq.componentId = props.name;
        boundsReq.width = boundsObj.width;
        boundsReq.height = boundsObj.height;
        boundsReq.x  = boundsObj.x;
        boundsReq.y = boundsObj.y;
        props.context.server.sendRequest(boundsReq, REQUEST_KEYWORDS.BOUNDS);
    }, [props.context.server, props.topbar])

    // Sets the pack size for a InternalFrame, which is basically the preferred-size of a layout
    const getPreferredFrameSize = (pSize:Dimension) => {
        const size = checkSizes(pSize, parseMinSize(props.minimumSize), parseMaxSize(props.maximumSize))
        if (packSize?.height !== size.height || packSize?.width !== size.width) {
            setPackSize({ height: size.height, width: size.width });
        }
    }

    /** Sets the RnD bounds (drag limitations for RnD). You can't drag it over tge menubar, but you can drag it out of the sides and bottom of the browser-window */
    useLayoutEffect(() => {
        if (rndRef.current) {
            rndRef.current.setState({bounds: {
                top: 0,
                left: -10000,
                right: 10000,
                bottom: 10000
            }});
        }
    }, [])

    // When the frame has already initialised, props.pack is true and a pack-size has already been calculated, update the size of the window and send a boundsreq to the server
    useEffect(() => {
        if (!initFrame.current && rndRef.current && props.pack && packSize && props.context.contentStore.getComponentById(props.id)) {
            rndRef.current.updateSize({ width: packSize.width as number + 8, height: packSize.height as number + 35 });
            setFrameStyle(packSize);
            (props.context.contentStore.getComponentById(props.id) as IInternalFrame).pack = false;
        }
    }, [props.pack, packSize]);

    // When the toFront property changes to true, put the frame into front
    useEffect(() => {
        if (props.toFront) {
            frameContext.openFramesCallback(props.name, true);
        }
    }, [props.toFront])

    // When the toBack property changes to true, put the frame into the back
    useEffect(() => {
        if (props.toBack) {
            frameContext.openFramesCallback(props.name, false);
        }
    }, [props.toBack])

    /** Handles the zIndex of frames */
    useEffect(() => {
        if (rndRef.current?.resizableElement.current) {
            const rndFrame:HTMLElement = rndRef.current.resizableElement.current;

            const rndStyle:CSSStyleDeclaration = rndFrame.style;

            if (props.modal) {
                rndStyle.setProperty("z-index", (1020 + frameContext.openFrames.length - frameContext.openFrames.indexOf(props.name)).toString())
            }
            else {
                rndStyle.setProperty("z-index", (frameContext.openFrames.length - frameContext.openFrames.indexOf(props.name)).toString());
            }
        }
    }, [frameContext.openFrames]);

    // Initially sets the framestyle and sends a boundsrquest to the server, also tells the frameContext the name of the opened frame
    useEffect(() => {
        if (props.context.transferType === "full" && props.context.launcherReady && initFrame.current) {
            if (rndRef.current) {
                if (bounds && (bounds.height || bounds.width)) {
                    rndRef.current.updateSize({ width: bounds.width + 8, height: bounds.height + 35 });
                    setFrameStyle({ position: "absolute", width: bounds.width, height: bounds.height });
                    initFrame.current = false;
                }
                else {
                    if (!props.pack && props.layoutStyle && props.layoutStyle.width && props.layoutStyle.height) {
                        //height + 35 because of header + border + padding, width + 8 because of padding + border 
                        rndRef.current.updateSize({ width: props.layoutStyle.width as number + 8, height: props.layoutStyle.height as number + 35 });
                        setFrameStyle(props.layoutStyle);
                        initFrame.current = false;
                    }
                    else if (packSize) {
                        rndRef.current.updateSize({ width: packSize.width as number + 8, height: packSize.height as number + 35 });
                        setFrameStyle(packSize);
                        (props.context.contentStore.getComponentById(props.id) as IInternalFrame).pack = false;
                        initFrame.current = false;
                    }
                }
            }
            frameContext.openFramesCallback(props.name, true);
        }
    //@ts-ignore
    }, [layoutStyle?.width, layoutStyle?.height, packSize, context.launcherReady, bounds]);

    // useEffect(() => {
    //     console.log(!initFrame.current && !positionFlag && frameStyle && framePosition)
    //     if (!initFrame.current && !positionFlag && frameStyle && framePosition) {
    //         sendBoundsRequest({ width: (frameStyle.width as number), height: (frameStyle.height as number), x: framePosition.x, y: framePosition.y });
    //     }
    // }, [frameStyle, framePosition])

    // When the server sends a dispose, call closeScreen
    useEffect(() => {
        if (props.dispose) {
            props.context.contentStore.closeScreen(props.id, props.name, props.content_className_ ? true : false);
        }   
    }, [props.dispose])

    // Centers the frame to its relative component
    useEffect(() => {
        if (rndRef.current && positionFlag) {
            if (bounds && (bounds.left || bounds.top)) {
                rndRef.current.updatePosition({ x: bounds.left, y: bounds.top });
                setFramePosition({ x: bounds.left, y: bounds.top })
                setPositionFlag(false);
            }
            else {
                if (props.centerRelativeTo) {
                    const relativeElem = getCenterRelativeElem();
                    const relativeComp = props.context.contentStore.getComponentById(props.centerRelativeTo);
                    const relativeCompParent = relativeComp ? props.context.contentStore.getComponentByName(props.context.contentStore.getScreenName(relativeComp.id) as string) : undefined;
                    
                    let parentElem;
                    if (relativeCompParent) {
                        parentElem = document.getElementById(relativeCompParent.name);
                        const launcherMenuHeight = document.getElementsByClassName("mobile-launcher-menu").length 
                        ? 
                            (document.getElementsByClassName("mobile-launcher-menu")[0] as HTMLElement).offsetHeight 
                        : 
                            0;
                        // The centerRelative Component only has the right size when its parent no longer has visibility hidden
                        if (relativeComp && relativeElem && frameStyle && parentElem?.style.visibility !== "hidden") {
                            const boundingRect = relativeElem.getBoundingClientRect();
                            // Calculate the center position of the frame and then add left respectively top of the relative component. 
                            // Take away the launcher menu height because top takes entire window 
                            let centerX = boundingRect.left + boundingRect.width / 2 - (frameStyle.width as number + 8) / 2;
                            let centerY = (boundingRect.top - launcherMenuHeight) + boundingRect.height / 2 - (frameStyle.height as number + 35) / 2;
                            rndRef.current.updatePosition({ x: centerX, y: centerY });
                            setFramePosition({ x: centerX, y: centerY })
                            if (!(relativeComp.id.includes("DP") && (boundingRect.height < 10 || boundingRect.width < 10))) {
                                setPositionFlag(false);
                            }
                            return
                        }
                    }
                }
                else {
                    rndRef.current.updatePosition({ x: 25 * (frameContext.openFrames.length - 1), y: 32 * (frameContext.openFrames.length - 1) });
                    setFramePosition({ x: 25 * (frameContext.openFrames.length - 1), y: 32 * (frameContext.openFrames.length - 1) })
                    setPositionFlag(false);
                    return
                }
            }
        }
    }, [props.layoutStyle?.width, props.layoutStyle?.height, frameStyle, positionFlag, bounds]);

    // Called on resize, sends a bounds-request to the server and sets the new framestyle
    const doResize = useCallback((e, dir, ref) => {
        const styleCopy:CSSProperties = {...frameStyle};
        //height - 35 because of header + border + padding, width - 8 because of padding + border. Minus because insets have to be taken away for layout
        styleCopy.height = ref.offsetHeight - 35;
        styleCopy.width = ref.offsetWidth - 8;

        clearTimeout(boundsTimer.current);
        boundsTimer.current = setTimeout(() => sendBoundsRequest({ width: styleCopy.width as number, height: styleCopy.height as number, x: framePosition.x, y: framePosition.y }), 1500);
        setFrameStyle(styleCopy);
    }, [frameStyle]);

    //Resizing-debounce for performance
    const handleResize = useCallback(_.debounce(doResize, 50),[doResize]);

    // init style for InternalFrame
    const style = {
        background: window.getComputedStyle(document.documentElement).getPropertyValue("--screen-background"),
        overflow: "hidden",
        zIndex: props.modal ? 1020 : 1,
        visibility: positionFlag ? "hidden" : undefined
    };

    return (
        (!frameContext.tabMode || props.modal) ?
            <>
                {props.modal && <div className="rc-glasspane" />}
                {children.length && <Rnd
                    id={props.name}
                    ref={rndRef}
                    style={style as CSSProperties}
                    onResize={handleResize}
                    onDragStop={(event) => {
                        sendBoundsRequest({ width: frameStyle ? (frameStyle.width as number) : 0, height: frameStyle ? (frameStyle.height as number) : 0, x: rndRef.current?.draggable.state.x, y: rndRef.current?.draggable.state.y})
                    }}
                    bounds={".xd"}
                    default={{
                        x: 0,
                        y: 0,
                        width: 200,
                        height: 200
                    }}
                    dragHandleClassName="rc-frame-header"
                    className={concatClassnames("rc-frame", props.styleClassNames)}
                    enableResizing={props.resizable !== false}
                >
                    <UIFrame
                        {...props}
                        internal
                        frameStyle={frameStyle}
                        sizeCallback={getPreferredFrameSize}
                        iconImage={props.iconImage}
                        children={children}
                        components={components.filter(comp => comp.props["~additional"] !== true)}
                        compSizes={componentSizes ? new Map([...componentSizes].filter(comp => props.context.contentStore.getComponentById(comp[0])?.["~additional"] !== true)) : undefined} />
                </Rnd>}
            </>
            :
            <UIFrame
                {...props}
                frameStyle={props.layoutStyle}
                sizeCallback={getPreferredFrameSize}
                iconImage={props.iconImage}
                children={children}
                components={components.filter(comp => comp.props["~additional"] !== true)}
                compSizes={componentSizes ? new Map([...componentSizes].filter(comp => props.context.contentStore.getComponentById(comp[0])?.["~additional"] !== true)) : undefined} />
    )
}
export default UIInternalFrame