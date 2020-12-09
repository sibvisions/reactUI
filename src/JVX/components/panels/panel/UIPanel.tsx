import React, {FC, useContext} from "react";
import './UIPanel.scss'
import Layout from "../../layouts/Layout";
import BaseComponent from "../../BaseComponent";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import useComponents from "../../zhooks/useComponents";
import Size from "../../util/Size";
import { sendOnLoadCallback } from "../../util/sendOnLoadCallback";
import { parseJVxSize } from "../../util/parseJVxSize";
import { Dialog } from 'primereact/dialog';
import { jvxContext } from "src/JVX/jvxProvider";
import { createCloseScreenRequest } from "src/JVX/factories/RequestFactory";
import REQUEST_ENDPOINTS from "src/JVX/request/REQUEST_ENDPOINTS";

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

    const context = useContext(jvxContext);
    const layoutContext = useContext(LayoutContext);
    const [props] = useProperties(baseProps.id, baseProps);
    const [components, preferredComponentSizes] = useComponents(baseProps.id);
    const {onLoadCallback, id} = baseProps;
    const prefSize = parseJVxSize(props.preferredSize);

    const getStyle = () => {
        const s = {...layoutContext.get(baseProps.id) || {}}
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

    const handleOnHide = () => {
        const csRequest = createCloseScreenRequest();
        csRequest.componentId = props.name;
        context.server.sendRequest(csRequest, REQUEST_ENDPOINTS.CLOSE_SCREEN);
        context.contentStore.closeScreen(props.name as string)
    }

    if (props.screen_modal_) {
        return (
            <Dialog header={props.screen_title_} visible={props.screen_modal_} onHide={handleOnHide} style={{height: prefSize?.height, width: prefSize?.width}}>
                <div id={props.id}>
                    <Layout
                        id={id}
                        layoutData={props.layoutData}
                        layout={props.layout}
                        reportSize={reportSize}
                        preferredCompSizes={preferredComponentSizes}
                        components={components}
                        style={getStyle()}
                        screen_modal_={props.screen_modal_}/>
                </div>
            </Dialog>
        )
    }

    return(
        <div id={props.id} style={{...layoutContext.get(baseProps.id), backgroundColor: props.background}}>
            <Layout
                id={id}
                layoutData={props.layoutData}
                layout={props.layout}
                preferredSize={props.preferredSize}
                reportSize={reportSize}
                preferredCompSizes={preferredComponentSizes}
                components={components}
                style={getStyle()}
                screen_modal_={props.screen_modal_}/>
        </div>
    )
}
export default UIPanel