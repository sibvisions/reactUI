import React, { useContext, useEffect, useState } from "react";

import { Button } from 'primereact/button';
import { ConfirmDialogProps } from 'primereact/confirmdialog'

import { appContext } from "../../AppProvider";
import { showTopBar, TopBarContext } from "../topbar/TopBar";
import { useTranslation } from ".";
import { DialogResponse } from "../../response";
import { createCloseFrameRequest, createPressButtonRequest } from "../../factories/RequestFactory";
import { REQUEST_ENDPOINTS } from "../../request";
import { concatClassnames } from "../util";

const useConfirmDialogProps = ():[boolean, ConfirmDialogProps] => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    const [messageProps, setMessageProps] = useState<DialogResponse>();

    const [visible, setVisible] = useState<boolean>(false);

    const [confirmProps, setConfirmProps] = useState<ConfirmDialogProps>({});

    const [closingFrame, setClosingFrame] = useState<{name:string, flag:boolean}>({name: "", flag:false});

    /** The topbar component */
    const topbar = useContext(TopBarContext);

    /** The translation */
    const translation = useTranslation();

    useEffect(() => {
        context.subscriptions.subscribeToDialog("message-dialog", (dialog:DialogResponse) => setMessageProps(dialog));
        context.subscriptions.subscribeToCloseFrame((compId:string) => setClosingFrame(prevState => { return { name: compId, flag:!prevState.flag } }));

        return () => {
            context.subscriptions.unsubscribeFromDialog("message-dialog");
            context.subscriptions.unsubscribeFromCloseFrame();
        }
    },[context.subscriptions]);

    useEffect(() => {
        setVisible(false);
    }, [closingFrame])

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
    
            const footerContent = (buttonType: 4 | 5 | 6 | 7 | 8 | -1, okCompId?: string, cancelCompId?: string, notOkCompId?: string) => {
                const sendPressButton = (compId?:string) => {
                    if (compId) {
                        const pressBtnReq = createPressButtonRequest();
                        pressBtnReq.componentId = compId;
                        showTopBar(context.server.sendRequest(pressBtnReq, REQUEST_ENDPOINTS.PRESS_BUTTON), topbar);
                    }
                }
    
                if (buttonType === 4 || buttonType === 5) {
                    return (
                        <>
                            <Button type="button" label={buttonType === 4 ? translation.get("Cancel") : translation.get("No")} onClick={event => {
                                sendPressButton(cancelCompId);
                            }} />
                            <Button type="button" label={buttonType === 4 ? translation.get("OK") : translation.get("Yes")} onClick={event => {
                                sendPressButton(okCompId);
                            }} />
                        </>
                    )
                }
                else if (buttonType === 6) {
                    return (
                        <Button type="button" label={translation.get("OK")} onClick={event => {
                            sendPressButton(okCompId);
                        }} />
                    )
                }
                else if (buttonType === 7) {
                    return (
                        <>
                            <div>
                                <Button type="button" label={translation.get("Cancel")} onClick={event => {
                                    sendPressButton(cancelCompId);
                                }} />
                                <Button type="button" label={translation.get("No")} style={{ marginLeft: '0.5rem' }} onClick={event => {
                                    sendPressButton(notOkCompId);
                                }} />
                            </div>
                            <Button type="button" label={translation.get("Yes")} onClick={event => {
                                sendPressButton(okCompId);
                            }} />
                        </>
                    )
                }
                else {
                    return
                }
            }
    
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
                        <span dangerouslySetInnerHTML={{ __html: messageProps.message as string}} />
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

            const handleOnHide = () => {
                const closeFrameReq = createCloseFrameRequest();
                closeFrameReq.componentId = messageProps.componentId;
                showTopBar(context.server.sendRequest(closeFrameReq, REQUEST_ENDPOINTS.CLOSE_FRAME), topbar);
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
                ) });

        }
    }, [messageProps]);

    return [visible, confirmProps];
}
export default useConfirmDialogProps;