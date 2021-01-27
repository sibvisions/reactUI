import React, {CSSProperties, FC, ReactNode, useLayoutEffect, useRef, useState} from "react";
import * as _ from 'underscore'

type onResizeEvent = (firstSize: splitSize, secondSize: splitSize) => void;

export type splitSize = { width: number, height: number }

export enum ORIENTATIONSPLIT {
    HORIZONTAL= 1,
    VERTICAL= 0
}

type SplitPanelProps = {
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

const SplitPanel: FC<SplitPanelProps> = (props) => {

    const [firstPosition, setFirstPosition] = useState<number | undefined>(props.dividerPosition !== -1 ? props.dividerPosition : undefined);
    const firstRef = useRef<HTMLDivElement>(null);
    const secondRef = useRef<HTMLDivElement>(null);
    let absolutePosition = 0;

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

    const stopDrag = () => {
        document.removeEventListener("mouseup", stopDrag);
        document.removeEventListener("mousemove", dragging);
    }

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

    const stopTouchDrag = () => {
        document.removeEventListener("touchend", stopTouchDrag);
        document.removeEventListener("touchmove", touchDragging);
    }

    const touchDragging = (event: TouchEvent) => {
         const newSeparatorPosition = event.targetTouches[0].clientX  - 20 - absolutePosition;
        if(newSeparatorPosition > 0){
            _.throttle(callOnResize, 30)()
            setFirstPosition(newSeparatorPosition);
        }
    }

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