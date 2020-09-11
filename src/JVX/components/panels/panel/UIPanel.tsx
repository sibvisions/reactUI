import React, {FC, useRef} from "react";
import Layout from "../../layouts/Layout";
import BaseComponent from "../../BaseComponent";

export interface Panel extends BaseComponent{
    layout: string,
    layoutData: string,
    "mobile.autoclose": boolean,
    "screen.title": string,
}

const UIPanel: FC<Panel> = (props) => {

    const divRef = useRef(null);


    return(
        <Layout onFinish={props.onLoadCallback} parentDivRef={divRef} id={props.id} layout={props.layout} layoutData={props.layoutData} />
    )
}
export default UIPanel