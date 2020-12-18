import React, {FC, useContext} from "react";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import useComponents from "../../zhooks/useComponents";
import Layout from "../../layouts/Layout";
import {Panel} from "../panel/UIPanel";
import Size from "../../util/Size";
import { sendOnLoadCallback } from "../../util/sendOnLoadCallback";
import { parseJVxSize } from "../../util/parseJVxSize";

const UIGroupPanel: FC<Panel> = (baseProps) => {

    const layoutContext = useContext(LayoutContext);
    const [props] = useProperties(baseProps.id, baseProps);
    const [components, preferredComponentSizes] = useComponents(baseProps.id);
    const {onLoadCallback, id} = baseProps;
    const prefSize = parseJVxSize(props.preferredSize);


    const getStyle = () => {
        let s:React.CSSProperties;
        if (props.screen_modal_ && prefSize)
            s = {...layoutContext.get(id), height: prefSize.height, width: prefSize.width}
        else if (props.screen_modal_)
            s = {...layoutContext.get(id), height: undefined, width: undefined}
        else
            s = {...layoutContext.get(id) || {}}
        s.top = undefined;
        s.left = undefined;
        (s.width as number) -= 0;
        (s.height as number) -= 28;
        return s
    }

    const reportSize = (height:number, width:number) => {
        if (onLoadCallback) {
            const prefSize:Size = {height: height+28, width: width};
            sendOnLoadCallback(id, prefSize, parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), undefined, onLoadCallback);
        }
    }

    return(
        <div className="jvx-panel-group" style={props.screen_modal_ ? { height: (prefSize?.height as number), width: prefSize?.width } : {...layoutContext.get(baseProps.id), backgroundColor: props.background}}>
            <div className="jvx-panel-group-caption"><span>{props.text}</span></div>
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