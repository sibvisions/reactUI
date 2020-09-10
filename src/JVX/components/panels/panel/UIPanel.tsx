import React, {FC} from "react";
import useChildren from "../../zhooks/useChildren";
import Layout from "../../layouts/Layout";
import BaseComponent from "../../BaseComponent";

export interface Panel extends BaseComponent{
    id: string,
    layout: string,
    layoutData: string,
    "mobile.autoclose": boolean,
    "screen.title": string,
}

const UIPanel: FC<Panel> = (props) => {

    return(
        <Layout id={props.id} layout={props.layout} layoutData={props.layoutData} />
    )
}
export default UIPanel