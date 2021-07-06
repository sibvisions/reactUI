/** React imports */
import React, { FC, ReactElement, useContext } from "react";

/** 3rd Party imports */
import { Dialog } from 'primereact/dialog';

/** Other imports */
import { IPanel } from "..";
import { appContext } from "../../../AppProvider";
import { createCloseScreenRequest } from "../../../factories/RequestFactory";
import { REQUEST_ENDPOINTS } from "../../../request";
import { showTopBar, TopBarContext } from "../../topbar/TopBar";

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
    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);

    /** When the Popup gets closed, send a closeScreenRequest to the server and call contentStore closeScreen */
    const handleOnHide = () => {
        context.server.closeScreen(baseProps.name)
    }

    return (
        <Dialog className="rc-popup" header={baseProps.screen_title_} visible={baseProps.screen_modal_} onHide={handleOnHide} resizable={false}>
            {baseProps.render}
        </Dialog>
    )
}
export default UIPopupWrapper