import React, {FC, ReactNode, useLayoutEffect, useRef, useState} from "react";
import "./SplitPanel.scss"
import Throttle from "../../util/Throttle";
import SplitImage from "../../../../assests/Split.png"

type onResizeEvent = (firstSize: splitSize, secondSize: splitSize) => void;

export type splitSize = { width: number, height: number }

type SplitPanelProps = {
    leftComponent?: ReactNode
    rightComponent?: ReactNode
    onResizeStart?: onResizeEvent
    onResize?: onResizeEvent
    onResizeEnd?: onResizeEvent
    trigger?: any
    onTrigger?: onResizeEvent
}

const SplitPanel: FC<SplitPanelProps> = (props) => {

    const [firstWidth, setFirstWidth] = useState<number | undefined>();
    const positionRef = useRef<HTMLDivElement>(null);
    const firstRef = useRef<HTMLDivElement>(null);
    const secondRef = useRef<HTMLDivElement>(null);
    let absoluteWidthPosition = 0;

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
        const newSeparatorPosition = event.clientX - 20 - absoluteWidthPosition;
        if(newSeparatorPosition > 0){
            Throttle(callOnResize, 16.5)()
            setFirstWidth(newSeparatorPosition);
        }
    }

    const stopDrag = () => {
        document.removeEventListener("mouseup", stopDrag);
        document.removeEventListener("mousemove", dragging);
    }

    const dragStart = (event: React.MouseEvent<HTMLDivElement>) => {
        if(positionRef.current){
            const size = positionRef.current.getBoundingClientRect();
            absoluteWidthPosition = size.x;
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
         const newSeparatorPosition = event.targetTouches[0].clientX  - 20 - absoluteWidthPosition;
        if(newSeparatorPosition > 0){
            Throttle(callOnResize, 16.5)()
            setFirstWidth(newSeparatorPosition);
        }
    }

    const dragTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
        if(positionRef.current){
            const size = positionRef.current.getBoundingClientRect();
            absoluteWidthPosition = size.x;
        }
        document.addEventListener("touchend", stopTouchDrag);
        document.addEventListener("touchmove", touchDragging);

    }

    useLayoutEffect(() => {
        callOnResize();
    }, [props.trigger])


    return(
        <div className={"splitPanel"} ref={positionRef}>
            <div ref={firstRef} className={"first"} style={{width: firstWidth || "25%"}}>
                {props.leftComponent}
            </div>
            <div className={"separator"} style={{backgroundImage:"url("+ SplitImage +")"}}  onMouseDown={dragStart} onTouchStart={dragTouchStart}>
            </div>
            <div ref={secondRef} className={"second"} >
                {props.rightComponent}
            </div>
        </div>
    )
}
export default SplitPanel