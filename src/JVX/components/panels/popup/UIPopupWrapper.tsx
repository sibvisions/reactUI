import React, {FC, ReactElement, useContext} from "react";
import { Panel } from "../panel/UIPanel";
import { Dialog } from 'primereact/dialog';
import { jvxContext } from "../../../jvxProvider";
import { createCloseScreenRequest } from "../../../factories/RequestFactory";
import REQUEST_ENDPOINTS from "../../../request/REQUEST_ENDPOINTS";

export interface IPopup extends Panel {
    render: ReactElement;
}

const UIPopupWrapper: FC<IPopup> = (baseProps) => {
    const context = useContext(jvxContext);

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