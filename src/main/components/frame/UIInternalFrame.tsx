import React, { CSSProperties, FC, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import _ from "underscore";
import { IWindow } from "../launcher/UIMobileLauncher";
import { parseMaxSize, parseMinSize, parsePrefSize, sendOnLoadCallback } from "../util";
import { useComponentConstants } from "../zhooks";
import UIFrame from "./UIFrame";

const UIInternalFrame: FC<IWindow> = (baseProps) => {
    /** Component constants */
    const [context, topbar, [props], layoutStyle, translation, compStyle] = useComponentConstants<IWindow>(baseProps, {visibility: 'hidden'});

    const [frameStyle, setFrameStyle] = useState<CSSProperties>();

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
            //@ts-ignore +26 because of header + border
            rndRef.current.updateSize({ width: layoutStyle?.width, height: layoutStyle?.height + 26 })
        }
        setFrameStyle(layoutStyle);
    }, [layoutStyle?.width, layoutStyle?.height]);

    const doResize = useCallback((e, dir, ref) => {
        const styleCopy:CSSProperties = {...frameStyle};

        styleCopy.height = ref.offsetHeight - 26;
        styleCopy.width = ref.offsetWidth;

        setFrameStyle(styleCopy);
    }, [frameStyle]);

    const handleResize = useCallback(_.throttle(doResize, 23),[doResize]);

    const style = {
        border: "solid 1px #ddd",
        background: window.getComputedStyle(document.documentElement).getPropertyValue("--screen-background"),
        overflow: "hidden",
        zIndex: 1
    };

    return (
        <Rnd
            ref={rndRef}
            style={style}
            onResize={handleResize}
            bounds="window"
            default={{
                x: 0,
                y: 0,
                width: 200,
                height: 200
            }}
            dragHandleClassName="rc-frame-header"
        >
            <UIFrame {...props} internal frameStyle={frameStyle} />
        </Rnd>
    )
}
export default UIInternalFrame