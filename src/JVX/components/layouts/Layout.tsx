import React, {CSSProperties, FC, ReactElement} from "react";
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