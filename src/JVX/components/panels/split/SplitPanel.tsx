import React, {FC, ReactElement, ReactNode, useRef, useState} from "react";
import "./SplitPanel.scss"


type SplitPanelProps = {
    leftComponent?: ReactNode
    rightComponent?: ReactNode
}

const SplitPanel: FC<SplitPanelProps> = (props) => {

    const [firstWidth, setFirstWidth] = useState<number | undefined>();
    const positionRef = useRef<HTMLDivElement>(null);
    let absoluteWidthPosition = 0;

    const dragging = (event: MouseEvent) => {
        let newSeparatorPosition = event.clientX - 20 - absoluteWidthPosition;
        if(newSeparatorPosition > 0){
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



    return(
        <div className={"splitPanel"} ref={positionRef}>
            <div className={"first"} style={{width: firstWidth || "50%"}}>
                {props.leftComponent}
            </div>
            <div className={"separator"} onMouseDown={dragStart} />
            <div className={"second"}>
                {props.rightComponent}
            </div>
        </div>
    )
}
export default SplitPanel