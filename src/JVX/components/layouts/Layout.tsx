import React, {FC, RefObject} from "react";
import FormLayout from "./FormLayout";
import BorderLayout from "./BorderLayout";
import LoadCallBack from "../util/LoadCallBack";

export type layout = {
    id: string
    layout: string,
    layoutData: string,
    parentDivRef: RefObject<HTMLDivElement>
    onFinish: LoadCallBack
}

const Layout: FC<layout> = (props) => {

    if(props.layout.includes("FormLayout")) {
        return ( <FormLayout {...props} /> );
    }
    else if(props.layout.includes("BorderLayout")) {
        return ( <BorderLayout {...props} /> );
    }
    else {
        return(
            <div>
                <h1>Not Yet Implemented</h1>
            </div>
        )
    }
}
export default Layout