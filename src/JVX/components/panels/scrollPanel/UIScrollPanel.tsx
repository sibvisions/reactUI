import {Panel} from "../panel/UIPanel";
import React, {FC, useContext} from "react";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import useComponents from "../../zhooks/useComponents";
import Layout from "../../layouts/Layout";

const UIScrollPanel: FC<Panel> = (baseProps) => {


    const layoutContext = useContext(LayoutContext);
    const [props] = useProperties(baseProps.id, baseProps);
    const [components, preferredComponentSizes] = useComponents(baseProps.id);

    const getStyle = () => {
        const s = {...layoutContext.get(baseProps.id) || {}};

        (s.width as number) -= 20;
        (s.height as number) -= 20;
        return s
    }

    return(
        <div style={{overflow: "scroll"}}>
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

export default UIScrollPanel