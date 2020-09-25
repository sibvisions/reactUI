import React, {Children, CSSProperties, FC, useEffect, useRef, useState} from "react";
import Menu from "./menu/menu";
import "./Layout.scss"
import ChildWithProps from "../JVX/components/util/ChildWithProps";
import {LayoutContext} from "../JVX/LayoutContext";
import Throttle from "../JVX/components/util/Throttle";

const Layout: FC = (props) => {

    const sizeRef = useRef<HTMLDivElement>(null);
    const [componentSize, setComponentSize] = useState(new Map<string, CSSProperties>())

    const doResize = () => {
        if(sizeRef.current){
            const size = sizeRef.current.getBoundingClientRect();
            const sizeMap = new Map<string, CSSProperties>();
            Children.forEach(props.children,child => {
                const childWithProps = (child as ChildWithProps);
                sizeMap.set(childWithProps.props.id, {width: size.width, height: size.height});
            });
            setComponentSize(sizeMap);
        }
    }

    const handleResize = () => {
        Throttle(doResize,75)()
    }

    useEffect(() => {
       window.addEventListener("resize", handleResize);
       return () => {
           window.removeEventListener("resize", handleResize);
       }
    });



    return(
        <div className={"layout"}>
            <Menu/>
            <LayoutContext.Provider value={componentSize}>
                <div ref={sizeRef} className={"main"}>
                    {props.children}
                </div>
            </LayoutContext.Provider>
            {/*<div style={{backgroundColor: "grey"}}>*/}
            {/*    <h4>footer</h4>*/}
            {/*</div>*/}
        </div>

    )
}
export default Layout