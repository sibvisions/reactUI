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
    text?: string
}

const UIPanel: FC<Panel> = (baseProps) => {

    const layoutContext = useContext(LayoutContext);
    const [props] = useProperties(baseProps.id, baseProps);
    const [components, preferredComponentSizes] = useComponents(baseProps.id);

    const getStyle = () => {
        const s = layoutContext.get(baseProps.id) || {}

        return s
    }

    return(
        <div>
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