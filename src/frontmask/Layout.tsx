import React, {Children, CSSProperties, FC, useContext, useEffect, useRef, useState} from "react";
import Menu from "./menu/menu";
import "./Layout.scss"
import useResizeLayout from "../JVX/components/zhooks/useResizeLayout";
import {jvxContext} from "../JVX/jvxProvider";
import ChildWithProps from "../JVX/components/util/ChildWithProps";
import {LayoutContext} from "../JVX/LayoutContext";

const Layout: FC = (props) => {

    const sizeRef = useRef<HTMLDivElement>(null);
    const [componentSize, setComponentSize] = useState(new Map<string, CSSProperties>())


    const handleResize = () => {
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
            <div style={{backgroundColor: "grey"}}>
                <h1>footer</h1>
            </div>
        </div>

    )
}
export default Layout