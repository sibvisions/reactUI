import React, { FC, useCallback, useLayoutEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { IWindow } from "../launcher/UIMobileLauncher";
import { Dimension, parseMaxSize, parseMinSize, parsePrefSize, sendOnLoadCallback } from "../util";
import { useComponentConstants } from "../zhooks";
import UIFrame from "./UIFrame";

const UIInternalFrame: FC<IWindow> = (baseProps) => {
    /** Component constants */
    const [context, topbar, [props], layoutStyle, translation, compStyle] = useComponentConstants<IWindow>(baseProps, {visibility: 'hidden'});

    const [frameSize, setFrameSize] = useState<Dimension>({ width: 0, height: 0 });

    /** Extracting onLoadCallback and id from baseProps */
    const { onLoadCallback, id } = baseProps;

    const rndRef = useRef(null);

    useLayoutEffect(() => {
        if (rndRef.current) {
            //@ts-ignore
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), rndRef.current.resizableElement.current, onLoadCallback)
        }
        
    },[onLoadCallback, props.preferredSize, props.maximumSize, props.minimumSize])

    const style = {
        border: "solid 1px #ddd",
        background: window.getComputedStyle(document.documentElement).getPropertyValue("--screen-background"),
        overflow: "hidden"
    };

    const frameSizeCallback = useCallback((size:Dimension) => {
        if (rndRef.current) {
            //@ts-ignore +27 because of header + border
            rndRef.current.updateSize({ width: layoutStyle?.width, height: layoutStyle?.height + 24 })
        }
    }, [layoutStyle?.width, layoutStyle?.height]);

    return (
        <Rnd
            ref={rndRef}
            style={style}
            bounds="parent"
            default={{
                x: 0,
                y: 0,
                width: 200,
                height: 200
            }}
            dragHandleClassName="rc-frame-header"
        >
            <UIFrame {...props} internal frameStyle={layoutStyle} sizeCallback={frameSizeCallback} />
        </Rnd>
    )
}
export default UIInternalFrame