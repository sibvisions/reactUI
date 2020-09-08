import React, {FC} from "react";
import FormLayout from "./FormLayout";
import BorderLayout from "./BorderLayout";
import {size} from "../zhooks/useChildren";

export type layout = {
    layout: string,
    layoutData: string,
    preferredSizes?: Map<string, size>
}


const Layout: FC<layout> = (props) => {

    if(props.layout.includes("FormLayout")) {
        return (
            <FormLayout {...props}>
                {props.children}
            </FormLayout>
        );
    }
    else if(props.layout.includes("BorderLayout")) {
        return (
            <BorderLayout {...props}>
                {props.children}
            </BorderLayout>
        );
    }
    else {
        return(
            <div>
                {props.children}
            </div>
        )
    }
}
export default Layout