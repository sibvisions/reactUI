import React, {FC, useContext} from "react";
import Layout from "../../layouts/Layout";
import BaseComponent from "../../BaseComponent";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import useComponents from "../../zhooks/useComponents";
import Size from "../../util/Size";
import { sendOnLoadCallback } from "../../util/sendOnLoadCallback";
import { parseJVxSize } from "../../util/parseJVxSize";

export interface Panel extends BaseComponent{
    orientation: number,
    layout: string,
    layoutData: string,
    "mobile.autoclose": boolean,
    screen_modal_?: boolean
    screen_navigationName_?:string
    screen_title_?: string,
}

const UIPanel: FC<Panel> = (baseProps) => {

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
        if (Object.getOwnPropertyDescriptor(s, 'top')?.configurable && Object.getOwnPropertyDescriptor(s, 'left')?.configurable) {
            s.top = undefined;
            s.left = undefined;
        }
        return s
    }

    const reportSize = (height:number, width:number) => {
        if (onLoadCallback) {
            const prefSize:Size = {height: height, width: width}
            sendOnLoadCallback(id, prefSize, parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), undefined, onLoadCallback);
        }
    }

    return(
        <div id={props.id} style={props.screen_modal_ ? { height: (prefSize?.height as number), width: prefSize?.width } : {...layoutContext.get(baseProps.id), backgroundColor: props.background}}>
            <Layout
                id={id}
                layoutData={props.layoutData}
                layout={props.layout}
                preferredSize={props.preferredSize}
                reportSize={reportSize}
                preferredCompSizes={preferredComponentSizes}
                components={components}
                style={getStyle()}/>
        </div>
    )
}
export default UIPanel