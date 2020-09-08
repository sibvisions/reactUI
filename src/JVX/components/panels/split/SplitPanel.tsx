import React, {FC, useRef, useState} from "react";
import "./SplitPanel.scss"

const SplitPanel:FC = (props) => {

    const [firstWidth, setFirstWidth] = useState<number | undefined>()
    const positionRef = useRef<HTMLDivElement>(null);

    const dragging = (event: MouseEvent) => {
        setFirstWidth(event.clientX - 20);
    }

    const stopDrag = () => {
        document.removeEventListener("mouseup", stopDrag);
        document.removeEventListener("mousemove", dragging);
    }

    const dragStart = (event: React.MouseEvent<HTMLDivElement>) => {
        document.addEventListener("mouseup", stopDrag);
        document.addEventListener("mousemove", dragging);
    }



    return(
        <div style={{width: 500, position: "absolute", left: 600}}>
            <div className={"splitPanel"} ref={positionRef}>
                <div className={"first"} style={{width: firstWidth || "50%"}}>
                    <h1>first</h1>
                </div>
                <div className={"separator"} onMouseDown={dragStart}>

                </div>
                <div className={"second"}>
                    <h1>second</h1>
                </div>
            </div>
        </div>
    )
}
export default SplitPanel