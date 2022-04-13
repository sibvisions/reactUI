import React, { FC, ReactElement, useContext } from "react";
import { Dialog } from 'primereact/dialog';
import { IPanel } from "..";
import { appContext } from "../../../AppProvider";
import { createCloseContentRequest, createCloseScreenRequest } from "../../../factories/RequestFactory";
import { REQUEST_KEYWORDS } from "../../../request";

/** Interface for Popup */
export interface IPopup extends IPanel {
    render: ReactElement;
}

/**
 * Component which is a wrapper for a Panel if it is a PopupPanel
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIPopupWrapper: FC<IPopup> = (baseProps) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** When the Popup gets closed, send a closeScreenRequest to the server and call contentStore closeScreen */
    const handleOnHide = () => {
        if (baseProps.screen_modal_) {
            const csRequest = createCloseScreenRequest();
            csRequest.componentId = baseProps.name;
            context.server.sendRequest(csRequest, REQUEST_KEYWORDS.CLOSE_SCREEN).then(res => {
                if (res[0] === undefined || res[0].name !== "message.error") {
                    if (context.version !== 2) {
                        context.server.lastClosedWasPopUp = true;
                    }
                    context.contentStore.closeScreen(baseProps.name);
                }
            });
        }
        else if (baseProps.content_modal_) {
            const ccRequest = createCloseContentRequest();
            ccRequest.componentId = baseProps.name;
            context.server.sendRequest(ccRequest, REQUEST_KEYWORDS.CLOSE_CONTENT).then(res => {
                if (res[0] === undefined || res[0].name !== "message.error") {
                    if (context.version !== 2) {
                        context.server.lastClosedWasPopUp = true;
                    }
                    context.contentStore.closeScreen(baseProps.name, true);
                }
            });
        }
    }

    return (
        <Dialog
            className="rc-popup"
            header={baseProps.screen_title_ || baseProps.content_title_}
            visible={baseProps.screen_modal_ || baseProps.content_modal_}
            onHide={handleOnHide} 
            resizable={false}
            >
            {baseProps.render}
        </Dialog>
    )
}
export default UIPopupWrapper