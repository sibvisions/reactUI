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

import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputTextarea } from "primereact/inputtextarea";
import { ListBox } from "primereact/listbox"
import React, { CSSProperties, FC, useCallback, useContext, useEffect, useMemo, useState } from "react";
import tinycolor from "tinycolor2";
import ErrorResponse from "../../main/response/error/ErrorResponse";
import { translation } from "../../main/util/other-util/Translation";
import { concatClassnames } from "../../main/util/string-util/ConcatClassnames";
import { createCloseFrameRequest } from "../../main/factories/RequestFactory";
import REQUEST_KEYWORDS from '../../main/request/REQUEST_KEYWORDS'
import useDesignerUpdates from "../../main/hooks/style-hooks/useDesignerUpdates";
import useButtonBackground from "../../main/hooks/style-hooks/useButtonBackground";
import { appContext } from "../../main/contexts/AppProvider";
import ContentStore from "src/main/contentstore/ContentStore";

/** Displays an error-message as dialog */
const ErrorDialog:FC = () => {
    /** Returns utility variables */
    const context = useContext(appContext);

    /** True, if the error-dialog is visible */
    const [visible, setVisible] = useState<boolean>(false);

    /** State of the error-properties */
    const [errorProps, setErrorProps] = useState<ErrorResponse>();

    /** True, if the error-details should be displayed */
    const [showDetails, setShowDetails] = useState<boolean>(false);

    /** Subscribes to designer-changes so the components are updated live */
    useDesignerUpdates("default-button");

    /** Updates the button background live */
    const bgdUpdate = useButtonBackground();

    /** The button background based on the color-scheme */
    const btnBgd = useMemo(() => window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color'), [bgdUpdate]);

    /** The currently selected error when details is expanded */
    const [selectedError, setSelectedError] = useState<{label: string, exception: string} | null>(null)

    // Builds the error-causes as items to show in the Listbox 
    const errorItems = useMemo(() => {
        return [{
            label: translation.get("Cause(s) of failure") as string,
            items: errorProps && errorProps.exceptions ? errorProps.exceptions.map(ex => {
                return { label: ex.message, exception: ex.exception }
            }) : []
        }]
    }, [errorProps]);

    // Subscribes to the error-dialog properties
    useEffect(() => {
        context.subscriptions.subscribeToErrorDialogProps((errData:ErrorResponse) => setErrorProps(errData));

        return () => context.subscriptions.unsubscribeFromErrorDialogProps();
    }, [context.subscriptions]);

    // When the error-dialog receives properties, set visible to true
    useEffect(() => {
        if (errorProps) {
            setVisible(true);
        }
    }, [errorProps]);

    // When the details-buttons is pressed and the details aren't showing, remove the 'width' and 'height' property to return to the default size without details.
    useEffect(() => {
        const elem = document.getElementById("error-dialog");
        if (!showDetails && elem) {
            elem.style.removeProperty("width");
            elem.style.removeProperty("height");
        }
    }, [showDetails]);

    // When the errorItems change, select the first item
    useEffect(() => {
        if (errorItems.length) {
            if (errorItems[0].items[0]) {
                setSelectedError(errorItems[0].items[0])
            }
        }
    }, [errorItems])

    /** Set visibility to false and send a close frame request to the server */ 
    const handleOnHide = useCallback(() => {
        if(visible) {
            setVisible(false);
            setShowDetails(false);
            if (errorProps && errorProps.componentId) {
                const closeFrameReq = createCloseFrameRequest();
                closeFrameReq.componentId = errorProps.componentId
                context.server.sendRequest(closeFrameReq, REQUEST_KEYWORDS.CLOSE_FRAME);

                //remove message from openMessages list
                const foundIndex = (context.contentStore as ContentStore).openMessages.findIndex(message => message ? message.id === errorProps.componentId : false);
                if (foundIndex > -1) {
                    (context.contentStore as ContentStore).openMessages.splice(foundIndex, 1);
                }
            }
        }
    }, [visible, setVisible, setShowDetails, errorProps?.componentId, context.contentStore])

    /** Build footer based on showDetails */ 
    const errorFooter = useCallback(() => {
        const showFooter = errorProps?.exceptions?.length || context.appReady;
        return showFooter ? (
            <div className="error-dialog-footer">
                <div className="error-dialog-footer-buttons">
                    {errorProps?.exceptions && errorProps.exceptions.length && <Button
                        type="button"
                        className="rc-button error-dialog-footer-button"
                        style={{
                            '--background': btnBgd,
                            '--hoverBackground': tinycolor(btnBgd).darken(5).toString(),
                            marginRight: "8px"
                        } as CSSProperties}
                        label={translation.get("Details")}
                        onClick={() => {
                            setSelectedError(errorItems.length ? errorItems[0].items[0] : null);
                            setShowDetails(prevState => !prevState)
                        }} />
                    }
                    {context.appReady && <Button
                        type="button"
                        className="rc-button error-dialog-footer-button"
                        style={{
                            '--background': btnBgd,
                            '--hoverBackground': tinycolor(btnBgd).darken(5).toString()
                        } as CSSProperties}
                        label={translation.get("OK")}
                        onClick={() => handleOnHide()} />
                    }
                </div>
                {showDetails &&
                    <div className="error-dialog-footer-details">
                        <div
                            className="rc-panel-group-caption error-dialog-details-caption"
                            style={{ marginTop: "1rem", textAlign: "left" }}>
                            <span>Details</span>
                        </div>
                        <ListBox
                            className="error-dialog-listbox"
                            value={selectedError}
                            optionGroupLabel="label"
                            optionGroupChildren="items"
                            optionLabel="label"
                            options={errorItems}
                            onChange={(e) => {
                                if (e.value !== null) {
                                    setSelectedError(e.value)
                                }
                            }} />
                        <InputTextarea
                            className={concatClassnames("rc-input", "error-dialog-textarea")}
                            value={selectedError?.exception}
                            style={{ resize: 'none' }}
                            readOnly />
                    </div>
                }
            </div>
        ) : null
    }, [showDetails, selectedError, errorProps, btnBgd, handleOnHide]);

    return (
        <Dialog
            id="error-dialog"
            className={concatClassnames("error-dialog", showDetails ? "error-details-enabled" : "") }
            header={translation.get(errorProps?.title as string) || translation.get("Error")} 
            footer={errorFooter}
            visible={visible} 
            onHide={handleOnHide} 
            baseZIndex={5000}
            resizable
            closable={context.appReady}
            draggable={context.appReady} >
            <i className="error-dialog-icon pi pi-times-circle" />
            <span style={{paddingTop: "4px"}}>{errorProps?.message}</span>
        </Dialog>
    )
}
export default ErrorDialog;