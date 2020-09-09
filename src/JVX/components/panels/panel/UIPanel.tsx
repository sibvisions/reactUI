import React, {FC, useLayoutEffect, useRef} from "react";
import useChildren from "../../zhooks/useChildren";
import Layout from "../../layouts/Layout";
import BaseComponent from "../../BaseComponent";

export interface panel extends BaseComponent{
    classNameEventSourceRef: string,
    layout: string,
    layoutData: string,
    "mobile.autoclose": boolean,
    "screen.title": string,
}

const UIPanel: FC<panel> = (props) => {
    const [children, preferredSizes] = useChildren(props.id);
    const availableDiv = useRef<HTMLDivElement>(null);


    return(
        <div style={{height: props.parent ? "" : "100%"}} id={props.id} ref={availableDiv}>
            <Layout
                layout={props.layout}
                layoutData={props.layoutData}
                preferredSizes={preferredSizes}
                availableSize={availableDiv.current ? availableDiv.current.getBoundingClientRect() : undefined}
            >
                {children}
            </Layout>
        </div>

    )
}
export default UIPanel