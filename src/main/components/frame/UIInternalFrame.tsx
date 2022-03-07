import React, { CSSProperties, FC, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import _ from "underscore";
import { createBoundsRequest } from "../../factories/RequestFactory";
import { REQUEST_ENDPOINTS } from "../../request";
import { IWindow } from "../launcher/UIMobileLauncher";
import { showTopBar } from "../topbar/TopBar";
import { Dimension, parseMaxSize, parseMinSize, parsePrefSize, sendOnLoadCallback } from "../util";
import { useComponentConstants, useComponents } from "../zhooks";
import UIFrame from "./UIFrame";

/**
 * This component displays an internal window which can be moved and resized (if resizable is true).
 * @param baseProps - the base properties of this component sent by the server.
 */
const UIInternalFrame: FC<IWindow> = (baseProps) => {
    /** Component constants */
    const [context, topbar, [props], layoutStyle, translation, compStyle] = useComponentConstants<IWindow>(baseProps, {visibility: 'hidden'});

    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [children, components, componentSizes] = useComponents(props.id, props.className);

    /** From the layoutstyle adjusted frame style, when measuring frame removes header from height */
    const [frameStyle, setFrameStyle] = useState<CSSProperties>();

    /** The size which is displayed when the "pack" is true, layoutStyle gets ignored and the preferred-size is shown */
    const [packSize, setPackSize] = useState<CSSProperties>();

    /** Extracting onLoadCallback and id from baseProps */
    const { onLoadCallback, id } = baseProps;

    const initial = useRef<boolean>(true);

    const rndRef = useRef(null);

    useLayoutEffect(() => {
        if (rndRef.current) {
            //@ts-ignore
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), rndRef.current.resizableElement.current, onLoadCallback)
        }
    }, [onLoadCallback]);

    const sendBoundsRequest = useCallback((size:Dimension) => {
        const boundsReq = createBoundsRequest();
        boundsReq.componentId = props.name;
        boundsReq.width = size.width;
        boundsReq.height = size.height;
        showTopBar(context.server.sendRequest(boundsReq, REQUEST_ENDPOINTS.BOUNDS), topbar);
    }, [context.server, topbar])

    useEffect(() => {
        if (initial.current) {
            if (rndRef.current) {
                if (!props.pack && layoutStyle && layoutStyle.width && layoutStyle.height) {
                    //@ts-ignore height + 39 because of header + border + padding, width + 12 because of padding + border 
                    rndRef.current.updateSize({ width: layoutStyle.width + 12, height: layoutStyle.height + 39 });
                    sendBoundsRequest({ width: layoutStyle.width as number, height: layoutStyle.height as number });
                    initial.current = false;
                }
                else if (packSize) {
                    //@ts-ignore
                    rndRef.current.updateSize({ width: packSize.width + 12, height: packSize.height + 39 });
                    sendBoundsRequest({ width: packSize.width as number, height: packSize.height as number });
                    initial.current = false;
                }
            }
    
            setFrameStyle(layoutStyle);
        }
    }, [layoutStyle?.width, layoutStyle?.height, packSize?.width, packSize?.height]);

    const doResize = useCallback((e, dir, ref) => {
        const styleCopy:CSSProperties = {...frameStyle};
        //height - 39 because of header + border + padding, width - 12 because of padding + border. Minus because insets have to be taken away for layout
        styleCopy.height = ref.offsetHeight - 39;
        styleCopy.width = ref.offsetWidth - 12;

        sendBoundsRequest({ width: styleCopy.width as number, height: styleCopy.height as number });
        setFrameStyle(styleCopy);
    }, [frameStyle]);

    const handleResize = useCallback(_.throttle(doResize, 23),[doResize]);

    const style = {
        background: window.getComputedStyle(document.documentElement).getPropertyValue("--screen-background"),
        overflow: "hidden",
        zIndex: 1
    };

    const getPreferredFrameSize = useCallback((size:Dimension) => {
        //height + 39 because of header + border + padding, width + 12 because of padding + border 
        if (packSize?.height !== size.height + 39 && packSize?.width !== size.width + 12) {
            setPackSize({ height: size.height + 39, width: size.width + 12 });
        }
    }, [packSize]);

    return (
        <>
            {children.length && <Rnd
                ref={rndRef}
                style={style}
                onResize={handleResize}
                bounds="parent"
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
                    frameStyle={!props.pack ? frameStyle : packSize}
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