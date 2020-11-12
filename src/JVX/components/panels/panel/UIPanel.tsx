import React, {FC, useContext} from "react";
import Layout from "../../layouts/Layout";
import BaseComponent from "../../BaseComponent";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import useComponents from "../../zhooks/useComponents";

export interface Panel extends BaseComponent{
    orientation: number,
    layout: string,
    layoutData: string,
    "mobile.autoclose": boolean,
    "screen.title"?: string,
}

const UIPanel: FC<Panel> = (baseProps) => {

    const layoutContext = useContext(LayoutContext);
    const [props] = useProperties(baseProps.id, baseProps);
    const [components, preferredComponentSizes] = useComponents(baseProps.id);

    const getStyle = () => {
        const s = layoutContext.get(baseProps.id) || {}
        if (Object.getOwnPropertyDescriptor(s, 'top')?.configurable && Object.getOwnPropertyDescriptor(s, 'left')?.configurable) {
            s.top = undefined;
            s.left = undefined;
        }
        return s
    }

    return(
        <div id={props.id} style={{...layoutContext.get(baseProps.id), backgroundColor: props.background}}>
            <Layout
                id={baseProps.id}
                layoutData={props.layoutData}
                layout={props.layout}
                onLoad={baseProps.onLoadCallback}
                preferredCompSizes={preferredComponentSizes}
                components={components}
                style={getStyle()}/>
        </div>
    )
}
export default UIPanel