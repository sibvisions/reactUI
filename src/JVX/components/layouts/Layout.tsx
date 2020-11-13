import React, {CSSProperties, FC, ReactElement, useLayoutEffect, useRef} from "react";
import FormLayout from "./FormLayout";
import BorderLayout from "./BorderLayout";
import FlowLayout from "./FlowLayout";
import {ComponentSize} from "../zhooks/useComponents";


export interface ILayout{
    id: string
    layout: string,
    layoutData: string,
    preferredSize?: string,
    components: Array<ReactElement>
    preferredCompSizes: Map<string, ComponentSize> | undefined
    style: CSSProperties,
    onLoad: Function | undefined
}


const Layout: FC<ILayout> = (props) => {
    if (props.layout) {
        if (props.layout.includes("FormLayout"))
            return <FormLayout {...props} />
        else if (props.layout.includes("BorderLayout"))
            return <BorderLayout {...props} />
        else if (props.layout.includes("FlowLayout"))
            return <FlowLayout {...props} />
        else
            return <DummyLayout {...props} />
    }
    else
        return <DummyLayout {...props} />

}
export default Layout




const DummyLayout: FC<ILayout> = (baseProps) => {

    const {
        components,
        style,
        id,
        onLoad
    } = baseProps

    const layoutSize = useRef<HTMLSpanElement>(null);

    useLayoutEffect(() => {
        if(layoutSize.current && onLoad){
            const size = layoutSize.current.getBoundingClientRect();
            onLoad(id, size.height, size.width);
        }
    }, [id, onLoad]);


    return(
        <span ref={layoutSize} style={style}>
            {components}
        </span>
    )
}