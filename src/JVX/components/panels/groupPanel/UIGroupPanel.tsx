import React, {FC, useContext} from "react";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import useComponents from "../../zhooks/useComponents";
import Layout from "../../layouts/Layout";
import {Panel} from "../panel/UIPanel";

const UIGroupPanel: FC<Panel> = (baseProps) => {

    const layoutContext = useContext(LayoutContext);
    const [props] = useProperties(baseProps.id, baseProps);
    const [components, preferredComponentSizes] = useComponents(baseProps.id);


    const getStyle = () => {
        const s = {...layoutContext.get(baseProps.id) || {}}
        s.top = undefined;
        s.left = undefined;
        console.log(s.height);
        (s.width as number) -= 10;
        (s.height as number) -= 10;
        return s
    }

    return(
        <div style={{...layoutContext.get(baseProps.id), border:"5px solid black"}}>
            <Layout
                id={baseProps.id}
                layoutData={props.layoutData}
                layout={props.layout}
                onLoad={baseProps.onLoadCallback}
                preferredCompSizes={preferredComponentSizes}
                components={components}
                style={{...getStyle(), overflow:"scroll" }}/>
        </div>

    )
}

export default UIGroupPanel