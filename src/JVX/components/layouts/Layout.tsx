import React, {FC} from "react";
import FormLayout from "./FormLayout";
import BorderLayout from "./BorderLayout";
import LoadCallBack from "../util/LoadCallBack";

export type layout = {
    parent: string | undefined
    id: string
    layout: string,
    layoutData: string,
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