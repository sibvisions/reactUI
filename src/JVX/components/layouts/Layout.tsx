import React, {CSSProperties, FC, ReactElement} from "react";
import FormLayout from "./FormLayout";
import BorderLayout from "./BorderLayout";
import FlowLayout from "./FlowLayout";
import {ComponentSize} from "../zhooks/useComponents";
import GridLayout from "./GridLayout";
import NullLayout from "./NullLayout";

/**
 * General information for layouts:
 * The Layout will start calculating when every child component of them reports its size. It will resize itself when the window resizes
 * or a component changes. Every component reports its preferredSize after measuring itself, then the layout calculates the constraints
 * for the componenst and "tells" them which size they are.
 */

 /** Interface for layouts */
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

/**
 * This component is a "middle man" between a panel and a layout, it takes the props from panel,
 * checks which layout should be used and passes the props to the layout.
 * @param props - props received by panel
 */
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