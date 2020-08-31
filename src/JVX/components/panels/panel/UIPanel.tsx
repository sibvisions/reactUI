import React, {FC, useState} from "react";
import useSubjects from "../../zhooks/useSubjects";
import Layout from "../../layouts/Layout";
import BaseComponent from "../../BaseComponent";


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
    const loaded = (sizeOfElement: size) => {
        if(!preferredSizes){
            childrenCounter++;
            tempSizes.set(sizeOfElement.id, sizeOfElement);

            if(childrenCounter === children.length){
                setSizes(tempSizes);
            }
        }
    }
    const [preferredSizes, setSizes] = useState<Map<string, size>>()
    const children = useSubjects(props.id, loaded);
    let childrenCounter = 0;


    return(
        <Layout layout={props.layout} layoutData={props.layoutData} preferredSizes={preferredSizes}>
            {children}
        </Layout>
    )
}
export default UIPanel