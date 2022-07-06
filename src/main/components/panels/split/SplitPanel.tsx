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

import React, { CSSProperties, FC, ReactNode, useLayoutEffect, useRef, useState } from "react";
import * as _ from 'underscore'
import { IForwardRef } from "../../../IForwardRef";
import { Tooltip } from "primereact/tooltip";
import Dimension from "../../../util/types/Dimension";
import { concatClassnames } from "../../../util/string-util/ConcatClassnames";

/** Type for ResizeEvent */
type onResizeEvent = (firstSize: Dimension, secondSize: Dimension) => void;

/** Enum for split orientation */
export enum ORIENTATIONSPLIT {
    HORIZONTAL= 1,
    VERTICAL= 0
}

/** Interface for SplitPanel */
interface ISplitPanel extends IForwardRef {
    id:string
    dividerPosition: number
    orientation: 0|1
    forwardedRef?: any
    leftComponent?: ReactNode
    rightComponent?: ReactNode
    onResizeStart?: onResizeEvent
    onResize?: onResizeEvent
    onResizeEnd?: onResizeEvent
    onResizeExtend?(e: MouseEvent|TouchEvent): void
    onResizeEndExtend?(e: { originalEvent: MouseEvent, delta: number }): void
    trigger?: any
    onTrigger?: onResizeEvent
    style?: CSSProperties
    onInitial: Function
    toolTipText?:string,
    popupMenu?:any,
    styleClassName?: string
}

/**
 * This component holds two components divided by a separator which can be dragged to adjust their size 
 * @param props - Props received by UISplitPanel which is the "wrapper" of this component
 */
const SplitPanel: FC<ISplitPanel> = (props) => {
    /** State of the position of the first component in the splitPanel */
    const [firstPosition, setFirstPosition] = useState<number | undefined>(props.dividerPosition !== -1 ? props.dividerPosition : undefined);

    /** Reference for the first component */
    const firstRef = useRef<HTMLDivElement>(null);

    /** Reference for the second component */
    const secondRef = useRef<HTMLDivElement>(null);

    const deltaRef = useRef<number>(0);

    /** The absolute position */
    let absolutePosition = 0;

    //const timer = useRef<any>(null)

    const [initial, setInitial] = useState<boolean>(true);

    /** Measures the sizes of the first and seconds components and then calls the onResize function given by props*/
    const callOnResize = (isInitial?: boolean) => {
        if (props.onResize && secondRef.current && firstRef.current) {
            const firstDom = firstRef.current.getBoundingClientRect();
            const secondDom = secondRef.current.getBoundingClientRect();

            // clearTimeout(timer.current);
            // timer.current = setTimeout(() => {
            //     if (props.onResize) {
            //         props.onResize(
            //             { width: firstDom.width, height: firstDom.height },
            //             { width: secondDom.width, height: secondDom.height }
            //         )
            //     }
            // }, 50)
            props.onResize(
                { width: firstDom.width, height: firstDom.height },
                { width: secondDom.width, height: secondDom.height }
            );
            if (isInitial) {
                props.onInitial();
            }
        }
    }

    /** When dragging, calcuate the new separator position based on mouseposition and set it, resize is also called throttled while dragging */
    const dragging = (event: MouseEvent) => {
        if (props.onResizeExtend) {
            props.onResizeExtend(event);
        }

        let newSeparatorPosition
        if (props.orientation === ORIENTATIONSPLIT.HORIZONTAL)
            newSeparatorPosition = event.clientX - 20 - absolutePosition;
        else
            newSeparatorPosition = event.clientY - 20 - absolutePosition;
        if(newSeparatorPosition > 0){
            _.throttle(callOnResize, 50)()
            setFirstPosition(newSeparatorPosition);
        }
    }

    /** Removes the dragging eventListeners */
    const stopDrag = (event:any) => {
        if (props.onResizeEndExtend) {
            if (props.orientation === ORIENTATIONSPLIT.HORIZONTAL) {
                props.onResizeEndExtend({ originalEvent: event, delta: event.clientX - deltaRef.current });
            }
            else {
                props.onResizeEndExtend({ originalEvent: event, delta: event.clientY - deltaRef.current });
            }
        }
        deltaRef.current = 0;
        document.removeEventListener("mouseup", stopDrag);
        document.removeEventListener("mousemove", dragging);
    }

    /** sets absolute position and adds eventListeners */
    const dragStart = (event: React.MouseEvent<HTMLDivElement>) => {
        if(props.forwardedRef.current){
            const size:DOMRect = props.forwardedRef.current.getBoundingClientRect();
            if (props.orientation === ORIENTATIONSPLIT.HORIZONTAL) {
                absolutePosition = size.x;
                deltaRef.current = event.clientX;
            }   
            else {
                absolutePosition = size.y;
                deltaRef.current = event.clientY;
            }
                
        }
        document.addEventListener("mouseup", stopDrag);
        document.addEventListener("mousemove", dragging);
    }

    //Touch ----------------------

    /** Removes touch eventlisteners */
    const stopTouchDrag = (event:any) => {
        if (props.onResizeEndExtend) {
            if (props.orientation === ORIENTATIONSPLIT.HORIZONTAL) {
                props.onResizeEndExtend({ originalEvent: event, delta: event.targetTouches[0].clientX - deltaRef.current });
            }
            else {
                props.onResizeEndExtend({ originalEvent: event, delta: event.targetTouches[0].clientY - deltaRef.current });
            }
        }
        deltaRef.current = 0;
        document.removeEventListener("touchend", stopTouchDrag);
        document.removeEventListener("touchmove", touchDragging);
    }

    /** When touch-dragging, calcuate the new separator position based on mouseposition and set it, resize is also called throttled while dragging */
    const touchDragging = (event: TouchEvent) => {
        if (props.onResizeExtend) {
            props.onResizeExtend(event);
        }

        const newSeparatorPosition = event.targetTouches[0].clientX  - 20 - absolutePosition;
        if(newSeparatorPosition > 0){
            _.throttle(callOnResize, 50)()
            setFirstPosition(newSeparatorPosition);
        }
    }

    /** sets absolute position and adds eventListeners */
    const dragTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
        if(props.forwardedRef.current){
            const size:DOMRect = props.forwardedRef.current.getBoundingClientRect();
            if (props.orientation === ORIENTATIONSPLIT.HORIZONTAL) {
                absolutePosition = size.x;
                deltaRef.current = event.targetTouches[0].clientX;
            }
            else {
                absolutePosition = size.y;
                deltaRef.current = event.targetTouches[0].clientY;
            }
                
        }
        document.addEventListener("touchend", stopTouchDrag);
        document.addEventListener("touchmove", touchDragging);
    }

    /** At the start and when layoutContext value for SplitPanel changes resize */
    useLayoutEffect(() => {
        if (props.trigger.width !== undefined && props.trigger.height !== undefined) {
            callOnResize();
            if (initial) {
                callOnResize(true);
                setInitial(false);
            }
        }
        
    }, [props.trigger.width, props.trigger.height])


    return (
        <>
            <Tooltip target={"#" + props.id}  />
            <div
                id={props.id}
                className={concatClassnames(
                    "rc-panel-split",
                    props.orientation === ORIENTATIONSPLIT.HORIZONTAL ? " h-split" : " v-split",
                    props.styleClassName
                )}
                ref={props.forwardedRef}
                style={props.style}
                data-pr-tooltip={props.toolTipText}
                data-pr-position="left"
                {...props.popupMenu} >
                <div
                    ref={firstRef}
                    className={props.orientation === ORIENTATIONSPLIT.HORIZONTAL ? "first-split-h" : "first-split-v"}
                    style={{
                        width: props.orientation === ORIENTATIONSPLIT.HORIZONTAL ?
                            firstPosition : undefined, height: props.orientation === ORIENTATIONSPLIT.VERTICAL ? firstPosition : undefined
                    }}>
                    {props.leftComponent}
                </div>
                <div
                    className={"separator " + (props.orientation === ORIENTATIONSPLIT.HORIZONTAL ? "h-separator" : "v-separator")}
                    onMouseDown={dragStart}
                    onTouchStart={dragTouchStart}>
                </div>
                <div ref={secondRef} className={"second-split"}>
                    {props.rightComponent}
                </div>
            </div>
        </>
    )
}
export default SplitPanel