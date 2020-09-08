import React, {FC} from "react";
import useChildren from "../../zhooks/useChildren";
import Layout from "../../layouts/Layout";

export type panel = {
    className: string,
    classNameEventSourceRef: string,
    id: string,
    layout: string,
    layoutData: string,
    "mobile.autoclose": boolean,
    name: string,
    "screen.title": string,
    onLoaded: Function
}



const UIPanel: FC<panel> = (props) => {
    const [children, preferredSizes] = useChildren(props.id);

    return(
        <Layout layout={props.layout} layoutData={props.layoutData} preferredSizes={preferredSizes}>
            {children}
        </Layout>
    )
}
export default UIPanel