/** React imports */
import React, { FC, ReactElement, useContext } from "react";

/** 3rd Party imports */
import { Dialog } from 'primereact/dialog';

/** Other imports */
import { IPanel } from "..";
import { appContext } from "../../../AppProvider";
import { useScreen } from "../../zhooks";

/** Interface for Popup */
export interface IPopup extends IPanel {
    render: ReactElement;
}

/**
 * Component which is a wrapper for a Panel if it is a PopupPanel
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIPopupWrapper: FC<IPopup> = (baseProps) => {
    /** access to api functions */
    const screen = useScreen(baseProps.name)

    /** When the Popup gets closed, send a closeScreenRequest to the server and call contentStore closeScreen */
    const handleOnHide = () => {
        screen.sendCloseScreen()
    }

    return (
        <Dialog className="rc-popup" header={baseProps.screen_title_} visible={baseProps.screen_modal_} onHide={handleOnHide} resizable={false}>
            {baseProps.render}
        </Dialog>
    )
}
export default UIPopupWrapper