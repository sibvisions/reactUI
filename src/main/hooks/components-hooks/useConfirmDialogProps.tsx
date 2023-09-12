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

import React, { CSSProperties, useEffect, useState } from "react";
import { Button } from 'primereact/button';
import { ConfirmDialogProps } from 'primereact/confirmdialog'
import { showTopBar } from "../../components/topbar/TopBar";
import { createCloseFrameRequest, createDispatchActionRequest } from "../../factories/RequestFactory";
import tinycolor from "tinycolor2";
import useConstants from "./useConstants";
import DialogResponse from "../../response/ui/DialogResponse";
import REQUEST_KEYWORDS from "../../request/REQUEST_KEYWORDS";
import { concatClassnames } from "../../util/string-util/ConcatClassnames";
import { translation } from "../../util/other-util/Translation";

/** Returns the ConfirmDialog properties and if the ConfirmDialog is visible */
const useConfirmDialogProps = ():[boolean, ConfirmDialogProps] => {
    /** Returns utility variables */
    const [context, topbar] = useConstants();

    /** The properties of the message */
    const [messageProps, setMessageProps] = useState<DialogResponse>();

    /** True, if the ConfirmDialog is visible */
    const [visible, setVisible] = useState<boolean>(false);

    /** The properties ConfirmDialog */
    const [confirmProps, setConfirmProps] = useState<ConfirmDialogProps>({});

    /** State which frame is closing */
    const [closingFrame, setClosingFrame] = useState<boolean>(false);

    // Subscribes the message dialog to its props and to closing-frame
    useEffect(() => {
        context.subscriptions.subscribeToMessageDialogProps((dialog:DialogResponse) => setMessageProps(dialog));
        context.subscriptions.subscribeToCloseFrame(() => setClosingFrame(prevState => !prevState));

        return () => {
            context.subscriptions.unsubscribeFromMessageDialogProps();
            context.subscriptions.unsubscribeFromCloseFrame();
        }
    },[context.subscriptions]);

    // When the frame closes, set visible false
    useEffect(() => {
        setVisible(false);
    }, [closingFrame]);

    // Renders the correct message layout based on the ButtonType
    useEffect(() => {
        if (messageProps) {
            const headerContent = (iconType: 0 | 1 | 2 | 3 | 9 | -1): { icon: string, text: string } => {
                if (iconType === 0) {
                    return { text: translation.get("Information") as string, icon: "pi pi-info-circle" };
                }
                else if (iconType === 1) {
                    return { text: translation.get("Warning") as string, icon: "pi pi-exclamation-circle" };
                }
                else if (iconType === 2) {
                    return { text: translation.get("Error") as string, icon: "pi pi-times-circle" };
                }
                else if (iconType === 3) {
                    return { text: translation.get("Question") as string, icon: "pi pi-question-circle" };
                }
                else {
                    return { text: "", icon: "" };
                }
            }
    
            /**
             * Builds the footer content based on the button type
             * @param buttonType - the button type
             * @param okCompId - the component id of the ok button
             * @param cancelCompId - the component id of the cancel button
             * @param notOkCompId - the component id of the not ok button
             */
            const footerContent = (buttonType: 4 | 5 | 6 | 7 | 8 | -1, okCompId?: string, cancelCompId?: string, notOkCompId?: string) => {
                const sendPressButton = (compId?:string) => {
                    if (compId) {
                        const pressBtnReq = createDispatchActionRequest();
                        pressBtnReq.componentId = compId;
                        showTopBar(context.server.sendRequest(pressBtnReq, REQUEST_KEYWORDS.PRESS_BUTTON), topbar);
                    }
                }

                // Returns the button background of the current color scheme
                const getButtonBackground = ():string => {
                    return window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color');
                }
    
                if (buttonType === 4 || buttonType === 5) {
                    return (
                        <>
                            <Button
                                type="button"
                                className="rc-button"
                                style={{
                                    '--background': getButtonBackground(),
                                    '--hoverBackground': tinycolor(getButtonBackground()).darken(5).toString()
                                } as CSSProperties}
                                label={messageProps.cancelText || (buttonType === 4 ? translation.get("Cancel") : translation.get("No"))}
                                onClick={() => {
                                    sendPressButton(cancelCompId);
                                }} />
                            <Button
                                type="button"
                                className="rc-button"
                                style={{
                                    '--background': getButtonBackground(),
                                    '--hoverBackground': tinycolor(getButtonBackground()).darken(5).toString()
                                } as CSSProperties}
                                label={messageProps.okText || (buttonType === 4 ? translation.get("OK") : translation.get("Yes"))}
                                onClick={() => {
                                    sendPressButton(okCompId);
                                }} />
                        </>
                    )
                }
                else if (buttonType === 6) {
                    return (
                        <Button
                            type="button"
                            className="rc-button"
                            style={{
                                '--background': getButtonBackground(),
                                '--hoverBackground': tinycolor(getButtonBackground()).darken(5).toString()
                            } as CSSProperties}
                            label={messageProps.okText || translation.get("OK")}
                            onClick={() => {
                                sendPressButton(okCompId);
                            }} />
                    )
                }
                else if (buttonType === 7) {
                    return (
                        <>
                            <div>
                                <Button
                                    type="button"
                                    className="rc-button"
                                    style={{
                                        '--background': getButtonBackground(),
                                        '--hoverBackground': tinycolor(getButtonBackground()).darken(5).toString()
                                    } as CSSProperties}
                                    label={messageProps.cancelText || translation.get("Cancel")}
                                    onClick={() => {
                                        sendPressButton(cancelCompId);
                                    }} />
                                <Button
                                    type="button"
                                    className="rc-button"
                                    label={messageProps.notOkText || translation.get("No")}
                                    style={{
                                        marginLeft: '0.5rem',
                                        '--background': getButtonBackground(),
                                        '--hoverBackground': tinycolor(getButtonBackground()).darken(5).toString()
                                    } as CSSProperties}
                                    onClick={() => {
                                        sendPressButton(notOkCompId);
                                    }} />
                            </div>
                            <Button
                                type="button"
                                className="rc-button"
                                style={{
                                    marginLeft: '0.5rem',
                                    '--background': getButtonBackground(),
                                    '--hoverBackground': tinycolor(getButtonBackground()).darken(5).toString()
                                } as CSSProperties}
                                label={messageProps.okText || translation.get("Yes")}
                                onClick={() => {
                                    sendPressButton(okCompId);
                                }} />
                        </>
                    )
                }
                else {
                    return
                }
            }
    
            // Returns the correct header type
            const getHeaderType = (iconType: 0 | 1 | 2 | 3 | 9 | -1) => {
                if (iconType === 0) {
                    return "info";
                }
                else if (iconType === 1) {
                    return "warning";
                }
                else if (iconType === 2) {
                    return "error";
                }
                else if (iconType === 3) {
                    return "question";
                }
            }
    
            const dialogHeader = 
                <>
                    {messageProps.iconType !== 9 && messageProps.iconType !== -1 &&
                        <div className={concatClassnames("message-dialog-header", getHeaderType(messageProps.iconType))}>
                            <div className="message-dialog-header-left">
                                <i className={concatClassnames("message-dialog-header-icon", headerContent(messageProps.iconType).icon)} />
                                <span className="message-dialog-header-text">{headerContent(messageProps.iconType).text}</span>
                            </div>
                        </div>
                    }
                </>
            
            const dialogMessage =
                <>
                    <div className="message-dialog-content">
                        {messageProps.message?.includes("<html>") ? <span dangerouslySetInnerHTML={{ __html: messageProps.message as string}} /> : <>{messageProps.message}</>}
                    </div>
                </>

            const dialogFooter =
                <>
                    {messageProps.buttonType !== 8 && messageProps.buttonType !== -1 && 
                        <div className={concatClassnames("message-dialog-footer", messageProps.buttonType === 6 ? "single-button" : "more-buttons")}>
                            {footerContent(messageProps.buttonType, messageProps.okComponentId, messageProps.cancelComponentId, messageProps.notOkComponentId)}
                        </div>
                    }
                </>

            // Sends a close-frame request to the server when the dialog is being closed
            const handleOnHide = () => {
                setVisible(false)
                const closeFrameReq = createCloseFrameRequest();
                closeFrameReq.componentId = messageProps.componentId;
                showTopBar(context.server.sendRequest(closeFrameReq, REQUEST_KEYWORDS.CLOSE_FRAME), topbar);
            }

            setVisible(true);
            
            setConfirmProps({ 
                header: dialogHeader, 
                message: dialogMessage, 
                footer: dialogFooter, 
                onHide: () => handleOnHide(),
                resizable: messageProps.resizable,
                closable: messageProps.closable,
                className: concatClassnames(
                    "rc-message-dialog", 
                    getHeaderType(messageProps.iconType),
                    messageProps.buttonType === 8 || messageProps.buttonType === -1 ? "message-dialog-no-footer" : ""
                ) });

        }
    }, [messageProps]);

    return [visible, confirmProps];
}
export default useConfirmDialogProps;