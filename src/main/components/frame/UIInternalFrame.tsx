import React, { CSSProperties, FC, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import _ from "underscore";
import { IWindow } from "../launcher/UIMobileLauncher";
import { Dimension, parseMaxSize, parseMinSize, parsePrefSize, sendOnLoadCallback } from "../util";
import { useComponentConstants } from "../zhooks";
import UIFrame from "./UIFrame";

interface IInternalFrame extends IWindow {
    pack?: boolean
    iconifiable?: boolean
    maximizable?:boolean
    iconImage?: string
    resizable?: boolean
}

/**
 * This component displays an internal window which can be moved and resized (if resizable is true).
 * @param baseProps - the base properties of this component sent by the server.
 */
const UIInternalFrame: FC<IInternalFrame> = (baseProps) => {
    /** Component constants */
    const [context, topbar, [props], layoutStyle, translation, compStyle] = useComponentConstants<IInternalFrame>(baseProps, {visibility: 'hidden'});

    /** From the layoutstyle adjusted frame style, when measuring frame removes header from height */
    const [frameStyle, setFrameStyle] = useState<CSSProperties>();

    /** The size which is displayed when the "pack" is true, layoutStyle gets ignored and the preferred-size is shown */
    const [packSize, setPackSize] = useState<CSSProperties>();

    /** Extracting onLoadCallback and id from baseProps */
    const { onLoadCallback, id } = baseProps;

    const rndRef = useRef(null);

    useLayoutEffect(() => {
        if (rndRef.current) {
            //@ts-ignore
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), rndRef.current.resizableElement.current, onLoadCallback)
        }
    }, [onLoadCallback]);

    useEffect(() => {
        if (rndRef.current) {
            if (!props.pack) {
                //@ts-ignore +24 because of header
                rndRef.current.updateSize({ width: layoutStyle?.width, height: layoutStyle?.height + 24 });
            }
            else {
                //@ts-ignore
                rndRef.current.updateSize({ width: packSize?.width, height: packSize?.height });
            }
        }
        setFrameStyle(layoutStyle);
    }, [layoutStyle?.width, layoutStyle?.height, packSize?.width, packSize?.height]);

    const doResize = useCallback((e, dir, ref) => {
        const styleCopy:CSSProperties = {...frameStyle};

        styleCopy.height = ref.offsetHeight - 24;
        styleCopy.width = ref.offsetWidth;

        setFrameStyle(styleCopy);
    }, [frameStyle]);

    const handleResize = useCallback(_.throttle(doResize, 23),[doResize]);

    const style = {
        background: window.getComputedStyle(document.documentElement).getPropertyValue("--screen-background"),
        overflow: "hidden",
        zIndex: 1
    };

    const getPreferredFrameSize = useCallback((size:Dimension) => {
        if (packSize && packSize?.height !== size.height + 24 && packSize?.width !== size.width) {
            setPackSize({ height: size.height + 24, width: size.width });
        }
    }, [packSize])

    return (
        <Rnd
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
                iconImage={props.iconImage} />
        </Rnd>
    )
}
export default UIInternalFrame