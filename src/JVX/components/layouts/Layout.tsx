import React, {CSSProperties, FC, ReactElement, useLayoutEffect, useRef} from "react";
import FormLayout from "./FormLayout";
import BorderLayout from "./BorderLayout";
import FlowLayout from "./FlowLayout";
import {ComponentSize} from "../zhooks/useComponents";
import GridLayout from "./GridLayout";
import NullLayout from "./NullLayout";


export interface ILayout{
    id: string
    layout: string,
    layoutData: string,
    preferredSize?: string,
    components: Array<ReactElement>
    preferredCompSizes: Map<string, ComponentSize> | undefined
    style: CSSProperties,
    reportSize: Function
}


const Layout: FC<ILayout> = (props) => {
    if (props.layout) {
        if (props.layout.includes("FormLayout"))
            return <FormLayout {...props} />
        else if (props.layout.includes("BorderLayout"))
            return <BorderLayout {...props} />
        else if (props.layout.includes("FlowLayout"))
            return <FlowLayout {...props} />
        else if (props.layout.includes("GridLayout"))
            return <GridLayout {...props} />
        else
            return <NullLayout {...props} />
    }
    else
        return <NullLayout {...props} />

}
export default Layout




const DummyLayout: FC<ILayout> = (baseProps) => {

    const {
        components,
        style,
        id,
        reportSize
    } = baseProps

    const layoutSize = useRef<HTMLSpanElement>(null);

    useLayoutEffect(() => {
        if(layoutSize.current && reportSize){
            const size = layoutSize.current.getBoundingClientRect();
            reportSize(size.height, size.width);
        }
    }, [id, reportSize]);


    return(
        <span ref={layoutSize} style={style}>
            {components}
        </span>
    )
}