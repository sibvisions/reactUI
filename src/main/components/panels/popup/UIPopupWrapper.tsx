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

import React, { FC, ReactElement, useContext, useEffect, useState } from "react";
import { Dialog } from 'primereact/dialog';
import { appContext } from "../../../contexts/AppProvider";
import { createCloseContentRequest, createCloseScreenRequest } from "../../../factories/RequestFactory";
import { IPanel } from "../panel/UIPanel";
import REQUEST_KEYWORDS from "../../../request/REQUEST_KEYWORDS";
import { concatClassnames } from "../../../util/string-util/ConcatClassnames";
import { IExtendablePopup } from "../../../extend-components/panels/ExtendPopupWrapper";

/** Interface for Popup */
export interface IPopup extends IPanel {
    render: ReactElement;
}

/**
 * Component which is a wrapper for a Panel if it is a PopupPanel
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIPopupWrapper: FC<IPopup & IExtendablePopup> = (baseProps) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** The current app-theme e.g. "basti" */
    const [appTheme, setAppTheme] = useState<string>(context.appSettings.applicationMetaData.applicationTheme.value);

    /** Subscribes the resize-handler to the theme */
    useEffect(() => {
        context.subscriptions.subscribeToTheme("popup", (theme:string) => setAppTheme(theme));

        return () => {
            context.subscriptions.unsubscribeFromTheme("popup");
        }
    }, [context.subscriptions]);

    /** When the Popup gets closed, send a closeScreenRequest to the server and call contentStore closeScreen */
    const handleOnHide = () => {
        if (baseProps.onClose) {
            baseProps.onClose();
        }

        if (baseProps.screen_modal_) {
            const csRequest = createCloseScreenRequest();
            csRequest.componentId = baseProps.name;
            context.server.sendRequest(csRequest, REQUEST_KEYWORDS.CLOSE_SCREEN).then(res => {
                if (res[0] === undefined || res[0].name !== "message.error") {
                    if (context.transferType !== "full") {
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
                    if (context.transferType !== "full") {
                        context.server.lastClosedWasPopUp = true;
                    }
                    context.contentStore.closeScreen(baseProps.name, true);
                }
            });
        }
    }

    // Calls lib-user events onDragStart, onDrag, onDragEnd if there are any
    return (
        <Dialog
            className={concatClassnames("rc-popup", baseProps.style, appTheme)}
            header={baseProps.screen_title_ || baseProps.content_title_}
            visible={baseProps.screen_modal_ || baseProps.content_modal_}
            onDrag={(e) => baseProps.onDrag ? baseProps.onDrag(e) : undefined}
            onDragStart={(e) => baseProps.onDragStart ? baseProps.onDragStart(e) : undefined}
            onDragEnd={(e) => baseProps.onDragEnd ? baseProps.onDragEnd(e) : undefined}
            onHide={handleOnHide} 
            resizable={false}
            baseZIndex={1010}
            >
            {baseProps.render}
        </Dialog>
    )
}
export default UIPopupWrapper