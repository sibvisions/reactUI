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

import React, { CSSProperties, FC, ReactElement, useCallback, useLayoutEffect, useRef, useState } from "react";
import * as _ from 'underscore'
import { IForwardRef } from "../../../IForwardRef";
import { Tooltip } from "primereact/tooltip";
import Dimension from "../../../util/types/Dimension";
import { concatClassnames } from "../../../util/string-util/ConcatClassnames";
import { parseMaxSize, parseMinSize } from "../../../util/component-util/SizeUtil";
import CustomProps from "../../../util/types/custom-types/CustomProps";

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
    leftComponent?: ReactElement<CustomProps>
    rightComponent?: ReactElement<CustomProps>
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
    /** Returns the initial first position of the divider */
    const getInitFirstPosition = useCallback(() => {
        let pos:number|undefined = undefined;
        if (props.dividerPosition !== -1) {
            const minSize = parseMinSize(props.leftComponent?.props.minimumSize);
            const maxSize = parseMaxSize(props.leftComponent?.props.maximumSize);
            if (!minSize && !maxSize) {
                pos = props.dividerPosition;
            }
            else {
                if (props.orientation === ORIENTATIONSPLIT.HORIZONTAL) {
                    if (minSize) {
                        if (props.dividerPosition < minSize.width) {
                            pos = minSize.width;
                        }
                        else {
                            pos = props.dividerPosition;
                        }
                    }
    
                    if (maxSize) {
                        if (props.dividerPosition > maxSize.width) {
                            pos = maxSize.width;
                        }
                        else {
                            pos = props.dividerPosition
                        }
                    }
                }
                else {
                    if (minSize) {
                        if (props.dividerPosition < minSize.height) {
                            pos = minSize.height;
                        }
                        else {
                            pos = props.dividerPosition;
                        }
                    }
    
                    if (maxSize) {
                        if (props.dividerPosition > maxSize.height) {
                            pos = maxSize.height;
                        }
                        else {
                            pos = props.dividerPosition
                        }
                    }
                }
            }
            return pos;
        }
    }, [props.dividerPosition, props.orientation, props.leftComponent, props.rightComponent])

    /** State of the position of the first component in the splitPanel */
    const [firstPosition, setFirstPosition] = useState<number | undefined>(getInitFirstPosition());

    /** Reference for the first component */
    const firstRef = useRef<HTMLDivElement>(null);

    /** Reference for the second component */
    const secondRef = useRef<HTMLDivElement>(null);

    /** The dragging-delta */
    const deltaRef = useRef<number>(0);

    /** The separator drag start position */
    let separatorDragStartPosition = 0;

    /** True, if this is the initial render */
    const [initial, setInitial] = useState<boolean>(true);

    /** Measures the sizes of the first and seconds components and then calls the onResize function given by props to recalculate the layout*/
    const callOnResize = (isInitial?: boolean) => {
        if (props.onResize && secondRef.current && firstRef.current) {
            const firstDom = firstRef.current.getBoundingClientRect();
            const secondDom = secondRef.current.getBoundingClientRect();

            props.onResize(
                { width: firstDom.width, height: firstDom.height },
                { width: secondDom.width, height: secondDom.height }
            );
            if (isInitial) {
                props.onInitial();
            }
        }
    }

    /** When dragging, calcuate the new separator position based on mouseposition and set it, resize is also called debounced while dragging */
    const dragging = (event: MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
        if (props.onResizeExtend) {
            props.onResizeExtend(event);
        }

        let newSeparatorPosition
        if (props.orientation === ORIENTATIONSPLIT.HORIZONTAL){
            newSeparatorPosition = separatorDragStartPosition + event.clientX - deltaRef.current;
        } else {
            newSeparatorPosition = separatorDragStartPosition + event.clientY - deltaRef.current;
        }
        if(newSeparatorPosition > 0){
            _.debounce(callOnResize, 50)()
            setFirstPosition(newSeparatorPosition);
        }
    }

    /** Removes the dragging eventListeners */
    const stopDrag = (event:any) => {
        document.body.style.userSelect = "";
        event.stopPropagation();
        event.preventDefault();
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
        document.body.style.userSelect = "none";
        event.stopPropagation();
        event.preventDefault();
        if (props.forwardedRef.current) {
            const size:DOMRect = props.forwardedRef.current.getBoundingClientRect();
            const separatorRect:DOMRect = event.currentTarget.getBoundingClientRect();
            if (props.orientation === ORIENTATIONSPLIT.HORIZONTAL) {
                separatorDragStartPosition = separatorRect.x - size.x;
                deltaRef.current = event.clientX;
            }   
            else {
                separatorDragStartPosition = separatorRect.y - size.y;
                deltaRef.current = event.clientY;
            }
                
        }
        document.addEventListener("mouseup", stopDrag);
        document.addEventListener("mousemove", dragging);
    }

    //Touch ----------------------

    /** Removes touch eventlisteners */
    const stopTouchDrag = (event:any) => {
        document.body.style.userSelect = "";
        event.stopPropagation();
        event.preventDefault();
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

    /** When touch-dragging, calcuate the new separator position based on mouseposition and set it, resize is also called debounced while dragging */
    const touchDragging = (event: TouchEvent) => {
        event.stopPropagation();
        event.preventDefault();
        if (props.onResizeExtend) {
            props.onResizeExtend(event);
        }

        const newSeparatorPosition = separatorDragStartPosition + event.targetTouches[0].clientX - deltaRef.current;
        if(newSeparatorPosition > 0){
            _.debounce(callOnResize, 50)()
            setFirstPosition(newSeparatorPosition);
        }
    }

    /** sets absolute position and adds eventListeners */
    const dragTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
        document.body.style.userSelect = "none";
        event.stopPropagation();
        event.preventDefault();
        if(props.forwardedRef.current){
            const size:DOMRect = props.forwardedRef.current.getBoundingClientRect();
            const separatorRect:DOMRect = event.currentTarget.getBoundingClientRect();
            if (props.orientation === ORIENTATIONSPLIT.HORIZONTAL) {
                separatorDragStartPosition = separatorRect.x - size.x;
                deltaRef.current = event.targetTouches[0].clientX;
            }
            else {
                separatorDragStartPosition = separatorRect.y - size.y;
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
        
    }, [props.trigger.width, props.trigger.height]);

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
                        width: props.orientation === ORIENTATIONSPLIT.HORIZONTAL ? firstPosition : undefined, 
                        height: props.orientation === ORIENTATIONSPLIT.VERTICAL ? firstPosition : undefined,
                        minWidth: props.orientation === ORIENTATIONSPLIT.HORIZONTAL ? props.leftComponent?.props.minimumSize ? parseMinSize(props.leftComponent?.props.minimumSize)?.width : undefined : undefined,
                        minHeight: props.orientation === ORIENTATIONSPLIT.VERTICAL ? props.leftComponent?.props.minimumSize ? parseMinSize(props.leftComponent?.props.minimumSize)?.height : undefined : undefined,
                        maxWidth: props.orientation === ORIENTATIONSPLIT.HORIZONTAL ? props.leftComponent?.props.maximumSize ? parseMaxSize(props.leftComponent?.props.maximumSize)?.width : undefined : undefined,
                        maxHeight: props.orientation === ORIENTATIONSPLIT.VERTICAL ? props.leftComponent?.props.maximumSize ? parseMaxSize(props.leftComponent?.props.maximumSize)?.height : undefined : undefined,
                    }}>
                    {props.leftComponent}
                </div>
                <div
                    className={"separator " + (props.orientation === ORIENTATIONSPLIT.HORIZONTAL ? "h-separator" : "v-separator")}
                    onMouseDown={dragStart}
                    onTouchStart={dragTouchStart}>
                </div>
                <div 
                    ref={secondRef} 
                    className={"second-split"}
                    style={{ 
                        minWidth: props.orientation === ORIENTATIONSPLIT.HORIZONTAL ? props.rightComponent?.props.minimumSize ? parseMinSize(props.rightComponent?.props.minimumSize)?.width : undefined : undefined,
                        minHeight: props.orientation === ORIENTATIONSPLIT.VERTICAL ? props.rightComponent?.props.minimumSize ? parseMinSize(props.rightComponent?.props.minimumSize)?.height : undefined : undefined,
                        maxWidth: props.orientation === ORIENTATIONSPLIT.HORIZONTAL ? props.rightComponent?.props.maximumSize ? parseMaxSize(props.rightComponent?.props.maximumSize)?.width : undefined : undefined,
                        maxHeight: props.orientation === ORIENTATIONSPLIT.VERTICAL ? props.rightComponent?.props.maximumSize ? parseMaxSize(props.rightComponent?.props.maximumSize)?.height : undefined : undefined,
                     }} >
                    {props.rightComponent}
                </div>
            </div>
        </>
    )
}
export default SplitPanel