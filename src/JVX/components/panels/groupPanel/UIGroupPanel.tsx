import React, {FC, useContext} from "react";
import './UIGroupPanel.scss'
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import useComponents from "../../zhooks/useComponents";
import Layout from "../../layouts/Layout";
import {Panel} from "../panel/UIPanel";

const UIGroupPanel: FC<Panel> = (baseProps) => {

    const layoutContext = useContext(LayoutContext);
    const [props] = useProperties(baseProps.id, baseProps);
    const [components, preferredComponentSizes] = useComponents(baseProps.id);
    const {onLoadCallback, id} = baseProps;


    const getStyle = () => {
        const s = {...layoutContext.get(baseProps.id) || {}}
        s.top = undefined;
        s.left = undefined;
        (s.width as number) -= 0;
        (s.height as number) -= 28;
        return s
    }

    const reportSize = (height:number, width:number) => {
        if (onLoadCallback) {
            onLoadCallback(id, height+28, width)
        }
    }

    return(
        <div className="jvxGroupPanel" style={{...layoutContext.get(baseProps.id), backgroundColor: props.background}}>
            <div className="jvxGroupPanel-caption"><span>{props.text}</span></div>
            <Layout
                id={id}
                layoutData={props.layoutData}
                layout={props.layout}
                reportSize={reportSize}
                preferredCompSizes={preferredComponentSizes}
                components={components}
                style={{...getStyle()}}/>
        </div>

    )
}

export default UIGroupPanel