import React, {FC, useContext, useLayoutEffect, useRef} from "react";
import FormLayout from "./FormLayout";
import BorderLayout from "./BorderLayout";
import LoadCallBack from "../util/LoadCallBack";
import useComponents from "../zhooks/useComponents";
import {LayoutContext} from "../../LayoutContext";
import FlowLayout from "./FlowLayout";

export type layout = {
    parent: string | undefined
    id: string
    layout: string,
    layoutData: string,
    orientation: number
    onFinish: LoadCallBack
    screenTitle?: string
}

const Layout: FC<layout> = (props) => {
    if(props.layout.includes("FormLayout"))
        return <FormLayout {...props}/>
    else if(props.layout.includes("BorderLayout"))
        return <BorderLayout {...props}/>
    else if(props.layout.includes("FlowLayout"))
        return <FlowLayout {...props}/>
    else
        return <DummyLayout {...props}/>
}
export default Layout




const DummyLayout: FC<layout> = (props) => {

    const layoutSize = useRef<HTMLDivElement>(null);
    const [children] = useComponents(props.id);
    const layoutValue = useContext(LayoutContext);

    useLayoutEffect(() => {
        if(layoutSize.current && props.onFinish){
            const size = layoutSize.current.getBoundingClientRect();

            props.onFinish(props.id, size.height, size.width);
        }
    }, [layoutSize, props]);


    return(
        <span id={props.id} ref={layoutSize} style={layoutValue.get(props.id)}>
            {children}
        </span>
    )
}