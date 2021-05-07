/** React import */
import React, { CSSProperties, FC, ReactNode, useLayoutEffect, useRef, useState } from "react";

/** 3rd Party import */
import * as _ from 'underscore'
import { IForwardRef } from "../../../IForwardRef";
import { Dimension } from "../../util";

/** Type for ResizeEvent */
type onResizeEvent = (firstSize: Dimension, secondSize: Dimension) => void;

/** Enum for split orientation */
export enum ORIENTATIONSPLIT {
    HORIZONTAL= 1,
    VERTICAL= 0
}

/** Interface for SplitPanel */
interface ISplitPanel extends IForwardRef {
    dividerPosition: number
    orientation: 0|1
    forwardedRef?: any
    leftComponent?: ReactNode
    rightComponent?: ReactNode
    onResizeStart?: onResizeEvent
    onResize?: onResizeEvent
    onResizeEnd?: onResizeEvent
    trigger?: any
    onTrigger?: onResizeEvent
    style?: CSSProperties
}

/**
 * This component holds two components divided by a seperator which can be dragged to adjust their size 
 * @param props - Props received by UISplitPanel which is the "wrapper" of this component
 */
const SplitPanel: FC<ISplitPanel> = (props) => {
    /** State of the position of the first component in the splitPanel */
    const [firstPosition, setFirstPosition] = useState<number | undefined>(props.dividerPosition !== -1 ? props.dividerPosition : undefined);
    /** Reference for the first component */
    const firstRef = useRef<HTMLDivElement>(null);
    /** Reference for the second component */
    const secondRef = useRef<HTMLDivElement>(null);
    /** The absolute position */
    let absolutePosition = 0;

    /** Measures the sizes of the first and seconds components and then calls the onResize function given by props*/
    const callOnResize = () => {
        if (props.onResize && secondRef.current && firstRef.current) {
            const firstDom = firstRef.current.getBoundingClientRect();
            const secondDom = secondRef.current.getBoundingClientRect();
            props.onResize(
                {width: firstDom.width, height: firstDom.height},
                {width: secondDom.width, height: secondDom.height}
            );
        }
    }

    /** When dragging, calcuate the new seperator position based on mouseposition and set it, resize is also called throttled while dragging */
    const dragging = (event: MouseEvent) => {
        let newSeparatorPosition
        if (props.orientation === ORIENTATIONSPLIT.HORIZONTAL)
            newSeparatorPosition = event.clientX - 20 - absolutePosition;
        else
            newSeparatorPosition = event.clientY - 20 - absolutePosition;
        if(newSeparatorPosition > 0){
            _.throttle(callOnResize, 30)()
            setFirstPosition(newSeparatorPosition);
        }
    }

    /** Removes the dragging eventListeners */
    const stopDrag = () => {
        document.removeEventListener("mouseup", stopDrag);
        document.removeEventListener("mousemove", dragging);
    }

    /** sets absolute position and adds eventListeners */
    const dragStart = (event: React.MouseEvent<HTMLDivElement>) => {
        if(props.forwardedRef.current){
            const size:DOMRect = props.forwardedRef.current.getBoundingClientRect();
            if (props.orientation === ORIENTATIONSPLIT.HORIZONTAL)
                absolutePosition = size.x;
            else
                absolutePosition = size.y;
        }
        document.addEventListener("mouseup", stopDrag);
        document.addEventListener("mousemove", dragging);
    }

    //Touch ----------------------

    /** Removes touch eventlisteners */
    const stopTouchDrag = () => {
        document.removeEventListener("touchend", stopTouchDrag);
        document.removeEventListener("touchmove", touchDragging);
    }

    /** When touch-dragging, calcuate the new seperator position based on mouseposition and set it, resize is also called throttled while dragging */
    const touchDragging = (event: TouchEvent) => {
         const newSeparatorPosition = event.targetTouches[0].clientX  - 20 - absolutePosition;
        if(newSeparatorPosition > 0){
            _.throttle(callOnResize, 30)()
            setFirstPosition(newSeparatorPosition);
        }
    }

    /** sets absolute position and adds eventListeners */
    const dragTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
        if(props.forwardedRef.current){
            const size:DOMRect = props.forwardedRef.current.getBoundingClientRect();
            if (props.orientation === ORIENTATIONSPLIT.HORIZONTAL)
                absolutePosition = size.x;
            else
                absolutePosition = size.y;
        }
        document.addEventListener("touchend", stopTouchDrag);
        document.addEventListener("touchmove", touchDragging);
    }

    /** At the start and when layoutContext value for SplitPanel changes resize */
    useLayoutEffect(() => {
        callOnResize();
    }, [props.trigger])


    return(
        <div className={"rc-panel-split" + (props.orientation === ORIENTATIONSPLIT.HORIZONTAL ? " h-split" : " v-split")} ref={props.forwardedRef} style={props.style}>
            <div ref={firstRef} className={props.orientation === ORIENTATIONSPLIT.HORIZONTAL ? "first-h" : "first-v"} style={{width: props.orientation === ORIENTATIONSPLIT.HORIZONTAL ? firstPosition : undefined, height: props.orientation === ORIENTATIONSPLIT.VERTICAL ? firstPosition : undefined}}>
                {props.leftComponent}
            </div>
            <div className={"separator " + (props.orientation === ORIENTATIONSPLIT.HORIZONTAL ? "h-seperator" : "v-seperator")} onMouseDown={dragStart} onTouchStart={dragTouchStart}>
            </div>
            <div ref={secondRef} className={"second"}>
                {props.rightComponent}
            </div>
        </div>
    )
}
export default SplitPanel