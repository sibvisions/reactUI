import React, {FC} from "react";
import Layout from "../../layouts/Layout";
import BaseComponent from "../../BaseComponent";

export interface Panel extends BaseComponent{
    orientation: number,
    layout: string,
    layoutData: string,
    "mobile.autoclose": boolean,
    "screen.title"?: string,
}

const UIPanel: FC<Panel> = (props) => {

    return(
        <Layout {...props} />
    )
}
export default UIPanel