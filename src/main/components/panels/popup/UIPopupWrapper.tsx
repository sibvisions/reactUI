/* Copyright 2022 SIB Visions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import React, { FC, ReactElement, useContext } from "react";
import { Dialog } from 'primereact/dialog';
import { IPanel } from "..";
import { appContext } from "../../../AppProvider";
import { createCloseContentRequest, createCloseScreenRequest } from "../../../factories/RequestFactory";
import { REQUEST_KEYWORDS } from "../../../request";
import { concatClassnames } from "../../../util";

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
            className={concatClassnames("rc-popup", baseProps.style)}
            header={baseProps.screen_title_ || baseProps.content_title_}
            visible={baseProps.screen_modal_ || baseProps.content_modal_}
            onHide={handleOnHide} 
            resizable={false}
            baseZIndex={1010}
            >
            {baseProps.render}
        </Dialog>
    )
}
export default UIPopupWrapper