import React, {FC} from "react";
import FormLayout from "./FormLayout";
import {size} from "../panels/panel/UIPanel";
import BorderLayout from "./BorderLayout";

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
            <h1>WRONG</h1>
        )
    }
}
export default Layout