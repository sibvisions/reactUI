import React, {FC, useState} from "react";
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

export type size = {
    id: string
    width: number,
    height: number
}

const UIPanel: FC<panel> = (props) => {
    const tempSizes = new Map<string, size>();
    const loaded = (id: string, height:number, width: number) => {
        if(!preferredSizes){
            childrenCounter++;
            tempSizes.set(id, {height: height, id: id, width: width});

            if(childrenCounter === children.length){
                setSizes(tempSizes);
            }
        }
    }
    const [preferredSizes, setSizes] = useState<Map<string, size>>()
    const children = useChildren(props.id, loaded);
    let childrenCounter = 0;

    return(
        <Layout layout={props.layout} layoutData={props.layoutData} preferredSizes={preferredSizes}>
            {children}
        </Layout>
    )
}
export default UIPanel