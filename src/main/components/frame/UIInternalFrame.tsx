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

type Coordinates = {
    x:number,
    y:number
}

/**
 * This component displays an internal window which can be moved and resized (if resizable is true).
 * @param baseProps - the base properties of this component sent by the server.
 */
const UIInternalFrame: FC<IWindow> = (baseProps) => {
    /** Component constants */
    const [context, topbar, [props], layoutStyle] = useComponentConstants<IWindow>(baseProps, {visibility: 'hidden'});

    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [children, components, componentSizes] = useComponents(props.id, props.className);
    
    const frameContext = useContext(FocusFrameContext);

    /** From the layoutstyle adjusted frame style, when measuring frame removes header from height */
    const [frameStyle, setFrameStyle] = useState<CSSProperties>();

    /** The size which is displayed when the "pack" is true, layoutStyle gets ignored and the preferred-size is shown */
    const [packSize, setPackSize] = useState<CSSProperties>();

    /** Extracting onLoadCallback and id from baseProps */
    const { onLoadCallback, id } = baseProps;

    const initFrame = useRef<boolean>(true);

    const initCenter = useRef<boolean>(true);

    const rndRef = useRef<Rnd>(null);

    const centerPosition = useMemo(():Coordinates => {
        const pos:Coordinates = {...centerPosition}
        if (props.centerRelativeTo) {
            const relativeComp = context.contentStore.getComponentById(props.centerRelativeTo);
            if (relativeComp) {
                const relativeElement = relativeComp.className === COMPONENT_CLASSNAMES.DESKTOPPANEL 
                ? 
                    document.getElementById(relativeComp.name) 
                :
                    document.getElementById(relativeComp.name)?.closest(".rc-frame") as HTMLElement;

                if (relativeElement && frameStyle) {
                    var style = window.getComputedStyle(relativeElement);
                    // gets the left and top value out of the style property 'transform'. 'm41' = left, 'm42' = top
                    var matrix = new WebKitCSSMatrix(style.transform);
                    pos.x = (relativeElement.getBoundingClientRect().width / 2 + matrix.m41) - ((frameStyle.width as number + 8) / 2);
                    pos.y = (relativeElement.getBoundingClientRect().height / 2 + matrix.m42) - ((frameStyle.height as number + 35) / 2);
                }
            }
        }
        return pos;
    }, [props.centerRelativeTo, frameStyle])

    useLayoutEffect(() => {
        if (rndRef.current) {
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), rndRef.current.resizableElement.current, onLoadCallback)
        }
    }, [onLoadCallback]);

    useEventHandler(rndRef.current?.resizableElement.current ? rndRef.current.resizableElement.current : undefined, "click", () => frameContext.callback(props.name));

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

    const sendBoundsRequest = useCallback((size:Dimension) => {
        const boundsReq = createBoundsRequest();
        boundsReq.componentId = props.name;
        boundsReq.width = size.width;
        boundsReq.height = size.height;
        context.server.sendRequest(boundsReq, REQUEST_ENDPOINTS.BOUNDS);
    }, [context.server, topbar])

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
    }, [layoutStyle?.width, layoutStyle?.height, packSize?.width, packSize?.height]);

    useEffect(() => {
        if (rndRef.current && initCenter.current && (centerPosition.x !== undefined && centerPosition.y !== undefined)) {
            rndRef.current.updatePosition(centerPosition);
            initCenter.current = false;
        }
    }, [centerPosition])

    const doResize = useCallback((e, dir, ref) => {
        const styleCopy:CSSProperties = {...frameStyle};
        //height - 35 because of header + border + padding, width - 8 because of padding + border. Minus because insets have to be taken away for layout
        styleCopy.height = ref.offsetHeight - 35;
        styleCopy.width = ref.offsetWidth - 8;

        sendBoundsRequest({ width: styleCopy.width as number, height: styleCopy.height as number });
        setFrameStyle(styleCopy);
    }, [frameStyle]);

    const handleResize = useCallback(_.throttle(doResize, 23),[doResize]);

    const style = {
        background: window.getComputedStyle(document.documentElement).getPropertyValue("--screen-background"),
        overflow: "hidden",
        zIndex: props.modal ? 1001 : 1
    };

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
                    x: centerPosition.x,
                    y: centerPosition.y,
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