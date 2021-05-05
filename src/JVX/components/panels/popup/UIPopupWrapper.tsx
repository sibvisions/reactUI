/** React imports */
import React, {FC, ReactElement, useContext} from "react";

/** 3rd Party imports */
import { Dialog } from 'primereact/dialog';

/** Other imports */
import { IPanel } from "../panel/UIPanel";
import { jvxContext } from "../../../jvxProvider";
import { createCloseScreenRequest } from "../../../factories/RequestFactory";
import REQUEST_ENDPOINTS from "../../../request/REQUEST_ENDPOINTS";

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
    const context = useContext(jvxContext);

    /** When the Popup gets closed, send a closeScreenRequest to the server and call contentStore closeScreen */
    const handleOnHide = () => {
        const csRequest = createCloseScreenRequest();
        csRequest.componentId = baseProps.name;
        context.server.sendRequest(csRequest, REQUEST_ENDPOINTS.CLOSE_SCREEN);
        context.contentStore.closeScreen(baseProps.name as string)
    }

    return (
        <Dialog header={baseProps.screen_title_} visible={baseProps.screen_modal_} onHide={handleOnHide}>
            {baseProps.render}
        </Dialog>
    )
}
export default UIPopupWrapper