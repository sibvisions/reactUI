import React, { CSSProperties, FC, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import _ from "underscore";
import { createBoundsRequest } from "../../factories/RequestFactory";
import { REQUEST_ENDPOINTS } from "../../request";
import COMPONENT_CLASSNAMES from "../COMPONENT_CLASSNAMES";
import { IWindow } from "../launcher/UIMobileLauncher";
import { FocusFrameContext } from "../panels/desktopPanel/UIDesktopPanel";
import { Dimension, parseMaxSize, parseMinSize, parsePrefSize, sendOnLoadCallback } from "../util";
import { useComponentConstants, useComponents, useEventHandler } from "../zhooks";
import UIFrame from "./UIFrame";

/**
 * This component displays an internal window which can be moved and resized (if resizable is true).
 * @param baseProps - the base properties of this component sent by the server.
 */
const UIInternalFrame: FC<IWindow> = (baseProps) => {
    /** Component constants */
    const [context, topbar, [props], layoutStyle] = useComponentConstants<IWindow>(baseProps, {visibility: 'hidden'});

    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [children, components, componentSizes] = useComponents(props.id, props.className);
    
    /** Context which Frame is currently in front */
    const frameContext = useContext(FocusFrameContext);

    /** From the layoutstyle adjusted frame style, when measuring frame removes header from height */
    const [frameStyle, setFrameStyle] = useState<CSSProperties>();

    /** The size which is displayed when the "pack" is true, layoutStyle gets ignored and the preferred-size is shown */
    const [packSize, setPackSize] = useState<CSSProperties>();

    /** Extracting onLoadCallback and id from baseProps */
    const { onLoadCallback, id } = baseProps;

    /** Flag, true, if framestyle needs to be initially set */
    const initFrame = useRef<boolean>(true);

    /** Returns the Element which this InternalFrame is centered to, or undefined if it wasn't found */
    const getCenterRelativeElem = useCallback(() => {
        if (props.centerRelativeTo) {
            const relativeComp = context.contentStore.getComponentById(props.centerRelativeTo);
            if (relativeComp) {
                if (relativeComp.className !== COMPONENT_CLASSNAMES.INTERNAL_FRAME) {
                    return document.getElementById(relativeComp.name);
                }
                else {
                    return document.getElementById(relativeComp.name)?.closest(".rc-frame") as HTMLElement
                }
            }
        }
        return undefined;
    }, [props.centerRelativeTo])

    /** Flag, true, if the InternalFrame still needs to be centered */
    const [centerFlag, setCenterFlag] = useState<boolean>(true);

    /** Reference for the Rnd element */
    const rndRef = useRef<Rnd>(null);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if (rndRef.current) {
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), rndRef.current.resizableElement.current, onLoadCallback)
        }
    }, [onLoadCallback]);

    /** Adds eventHandler to call the frameContext callback on mouse-down to tell the DesktopPanel that this frame is at front */
    useEventHandler(rndRef.current?.resizableElement.current ? rndRef.current.resizableElement.current : undefined, "mousedown", () => frameContext.callback(props.name));

    /** Handles the zIndex of frames */
    useEffect(() => {
        if (rndRef.current?.resizableElement.current) {
            const rndFrame:HTMLElement = rndRef.current.resizableElement.current;

            const rndStyle:CSSStyleDeclaration = rndFrame.style;
            if (rndStyle.zIndex === "5" && frameContext.name !== props.name) {
                rndFrame.style.setProperty("z-index", props.modal ? "1001" : "1");
            }
            else if (rndStyle.zIndex !== "5" && frameContext.name === props.name) {
                rndFrame.style.setProperty("z-index", props.modal ? "1005" : "5");
            }
        }
    }, [frameContext])

    /** When the centerRelativeTo property changes, center again */
    useEffect(() => {
        setCenterFlag(true);
    }, [props.centerRelativeTo])

    /**
     * Sends a bounds-request to the server
     * @param size - the size of the InternalFrame
     */
    const sendBoundsRequest = useCallback((size:Dimension) => {
        const boundsReq = createBoundsRequest();
        boundsReq.componentId = props.name;
        boundsReq.width = size.width;
        boundsReq.height = size.height;
        context.server.sendRequest(boundsReq, REQUEST_ENDPOINTS.BOUNDS);
    }, [context.server, topbar])

    // Initially sets the framestyle and sends a boundsrquest to the server, also tells the frameContext the name of the opened frame
    useEffect(() => {
        if (initFrame.current) {
            if (rndRef.current) {
                if (!props.pack && layoutStyle && layoutStyle.width && layoutStyle.height) {
                    //height + 35 because of header + border + padding, width + 8 because of padding + border 
                    rndRef.current.updateSize({ width: layoutStyle.width as number + 8, height: layoutStyle.height as number + 35 });
                    sendBoundsRequest({ width: layoutStyle.width as number, height: layoutStyle.height as number });
                    setFrameStyle(layoutStyle);
                    initFrame.current = false;
                }
                else if (packSize) {
                    rndRef.current.updateSize({ width: packSize.width as number + 8, height: packSize.height as number + 35 });
                    sendBoundsRequest({ width: packSize.width as number, height: packSize.height as number });
                    setFrameStyle(packSize);
                    initFrame.current = false;
                }
            }
            frameContext.callback(props.name);
        }
    }, [layoutStyle, packSize]);

    // useEffect(() => {
    //     if (!initFrame.current && rndRef.current && props.pack && packSize) {
    //         rndRef.current.updateSize({ width: packSize.width as number + 8, height: packSize.height as number + 35 });
    //         sendBoundsRequest({ width: packSize.width as number, height: packSize.height as number });
    //         setFrameStyle(packSize);
    //         frameContext.callback(props.name);
    //     }
    // }, [props.pack]);

    // Centers the frame to its relative component
    useEffect(() => {
        if (rndRef.current && centerFlag) {
            if (props.centerRelativeTo) {
                const relativeElem = getCenterRelativeElem();
                const relativeComp = context.contentStore.getComponentById(props.centerRelativeTo);
                const relativeCompParent = context.contentStore.getComponentById(relativeComp?.parent);
                let parentElem;

                if (relativeCompParent) {
                    parentElem = document.getElementById(relativeCompParent.name);
                    // The centerRelative Component only has the right size when its parent no longer has visibility hidden
                    if (relativeElem && frameStyle && parentElem?.style.visibility !== "hidden") {
                        var style = window.getComputedStyle(relativeElem);
                        // gets the left and top value out of the style property 'transform'. 'm41' = left, 'm42' = top
                        var matrix = new WebKitCSSMatrix(style.transform);
                        let centerX = (relativeElem.getBoundingClientRect().width / 2 + matrix.m41) - ((frameStyle.width as number + 8) / 2);
                        let centerY = (relativeElem.getBoundingClientRect().height / 2 + matrix.m42) - ((frameStyle.height as number + 35) / 2);
                        rndRef.current.updatePosition({ x: centerX, y: centerY });
                        setCenterFlag(false);
                        return
                    }
                }
            }
            else {
                rndRef.current.updatePosition({ x: 0, y: 0 });
                setCenterFlag(false);
                return
            }
        }
    }, [layoutStyle?.width, layoutStyle?.height, frameStyle, centerFlag]);

    // Called on resize, sends a bounds-request to the server and sets the new framestyle
    const doResize = useCallback((e, dir, ref) => {
        const styleCopy:CSSProperties = {...frameStyle};
        //height - 35 because of header + border + padding, width - 8 because of padding + border. Minus because insets have to be taken away for layout
        styleCopy.height = ref.offsetHeight - 35;
        styleCopy.width = ref.offsetWidth - 8;

        sendBoundsRequest({ width: styleCopy.width as number, height: styleCopy.height as number });
        setFrameStyle(styleCopy);
    }, [frameStyle]);

    //Resizing-throttle for performance
    const handleResize = useCallback(_.throttle(doResize, 23),[doResize]);

    // init style for InternalFrame
    const style = {
        background: window.getComputedStyle(document.documentElement).getPropertyValue("--screen-background"),
        overflow: "hidden",
        zIndex: props.modal ? 1001 : 1,
        visibility: centerFlag ? "hidden" : undefined
    };

    // Sets the pack size for a InternalFrame, which is basically the preferred-size of a layout
    const getPreferredFrameSize = useCallback((size:Dimension) => {
        //height + 35 because of header + border + padding, width + 8 because of padding + border 
        if (packSize?.height !== size.height + 35 && packSize?.width !== size.width + 8) {
            setPackSize({ height: size.height + 35, width: size.width + 8 });
        }
    }, [packSize]);

    return (
        <>
            {props.modal && <div className="rc-glasspane" />}
            {children.length && <Rnd
                ref={rndRef}
                style={style as CSSProperties}
                onResize={handleResize}
                bounds={props.modal ? "window" : "parent"}
                default={{
                    x: 0,
                    y: 0,
                    width: 200,
                    height: 200
                }}
                dragHandleClassName="rc-frame-header"
                className="rc-frame"
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
                    compSizes={componentSizes ? new Map([...componentSizes].filter(comp => context.contentStore.getComponentById(comp[0])?.["~additional"] !== true)) : undefined} />
            </Rnd>}
        </>
    )
}
export default UIInternalFrame