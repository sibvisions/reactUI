import React, {FC} from "react";
import FormLayout from "./FormLayout";
import {size} from "../panels/panel/UIPanel";

export type layout = {
    layout: string,
    layoutData: string,
    preferredSizes?: Map<string, size>
}


const Layout: FC<layout> = (props) => {

    if(props.layout.includes("FormLayout")){
        return(
            <FormLayout {...props}>
                {props.children}
            </FormLayout>
        )
    } else {
        return(
            <h1>WRONG</h1>
        )
    }
}
export default Layout