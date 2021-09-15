/** React imports */
import React, { FC, useCallback, useContext, useEffect, useRef, useState } from 'react';

/** Hook imports */
import { useTranslation } from '../zhooks';

/** 3rd Party imports */
import { Toast, ToastMessage } from 'primereact/toast';
import { Button } from 'primereact/button';

/** Other imports */
import { appContext } from '../../AppProvider';
import { DialogResponse, ErrorResponse, MessageResponse } from '../../response';
import { showTopBar, TopBarContext } from '../topbar/TopBar';
import { concatClassnames } from '../util';
import { createCloseFrameRequest, createPressButtonRequest } from '../../factories/RequestFactory';
import { REQUEST_ENDPOINTS } from '../../request';

type IToast = {
    dialog:DialogResponse|MessageResponse|ErrorResponse,
    error:boolean
}

/** This component displays a toast which either is a error toast or a message sent by the server */
const UIToast: FC = () => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Toast reference for error messages */
    const toastErrRef = useRef<Toast>(null);

    /** Toast reference for information messages */
    const toastInfoRef = useRef<Toast>(null);

    /** Index reference for removing toast */
    const toastIndex = useRef<number>(0);

    /** State of the toast properties (content, if it is an error or a message) */
    const [toastProps, setToastProps] = useState<IToast>();

    const [closingFrame, setClosingFrame] = useState<{name:string, flag:boolean}>({name: "", flag:false});

    /** The topbar component */
    const topbar = useContext(TopBarContext);

    /** The translation */
    const translation = useTranslation();

    //TODO: Maybe in the future PrimeReact will release a "proper" way to close a single toast message.
    //Currently they only allow us to use the clear function which clears every toast message.
    const handleClose = useCallback((elem:HTMLElement) => {
        if (elem) {
            let id = -1;
            elem.classList.forEach(className => {
                if (className.includes("toast-")) {
                    id = parseInt(className.substring(6));
                }
            });
            if (id !== -1) {
                const newMessages = [...toastInfoRef.current?.state.messages].filter(message => message.id !== id);
                toastInfoRef.current?.setState({ messages: newMessages });
            }
        }
    },[])

    /** Subscribes the toast components to messages */
    useEffect(() => {
        context.subscriptions.subscribeToMessage((dialog:DialogResponse|MessageResponse|ErrorResponse, err:boolean) => setToastProps({dialog: dialog, error: err}));
        context.subscriptions.subscribeToCloseFrame((compId:string) => setClosingFrame(prevState => { return { name: compId, flag:!prevState.flag } }));
        return () => {
            context.subscriptions.unsubscribeFromMessage();
            context.subscriptions.unsubscribeFromCloseFrame();
        }
    },[context.subscriptions]);

    useEffect(() => {
        if (closingFrame) {
            handleClose(document.getElementsByClassName(closingFrame.name)[0] as HTMLElement)
        }
    },[closingFrame, handleClose])

    /** Toast showing, styling and hiding handling */
    useEffect(() => {
        if (toastInfoRef.current && toastErrRef.current && toastIndex.current !== null && toastProps) {
            if (toastProps.error) {
                const toast: ToastMessage = { severity: 'error', summary: toastProps.dialog.message }
                toastErrRef.current.show(toast);
                toastIndex.current++;
            }
            else {
                const castedDialog = toastProps.dialog as DialogResponse;


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
                            showTopBar(context.server.sendRequest(pressBtnReq, REQUEST_ENDPOINTS.PRESS_BUTTON), topbar)
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

                const messageObj: ToastMessage = { summary: castedDialog.message, sticky: true, closable: false };

                messageObj.content =
                    (castedDialog && castedDialog.iconType !== undefined) ? (
                        <div className={concatClassnames("p-flex", "p-flex-column", "index-helper", "toast-" + toastIndex.current, castedDialog.componentId)}>
                            {castedDialog.iconType !== 9 && castedDialog.iconType !== -1 && 
                            <div className={concatClassnames("toast-header", getHeaderType(castedDialog.iconType))}>
                                <div className="toast-header-left">
                                    <i className={concatClassnames("toast-header-icon", headerContent(castedDialog.iconType).icon)} />
                                    <span className="toast-header-text">{headerContent(castedDialog.iconType).text}</span>
                                </div>
                                {castedDialog.closable && <button
                                    className="toast-header-close pi pi-times"
                                    onClick={event => {
                                        const closeFrameReq = createCloseFrameRequest();
                                        closeFrameReq.componentId = castedDialog.componentId;
                                        showTopBar(context.server.sendRequest(closeFrameReq, REQUEST_ENDPOINTS.CLOSE_FRAME), topbar);
                                        handleClose((event.target as HTMLElement).closest('.index-helper') as HTMLElement);
                                    }} />}
                            </div>}
                            <div className="toast-content">
                                <span dangerouslySetInnerHTML={{ __html: messageObj.summary as string}} />
                            </div>
                            {castedDialog.buttonType !== 8 && castedDialog.buttonType !== -1 && 
                            <div className={concatClassnames("toast-footer", castedDialog.buttonType === 6 ? "single-button" : "more-buttons")}>
                                {footerContent(castedDialog.buttonType, castedDialog.okComponentId, castedDialog.cancelComponentId, castedDialog.notOkComponentId)}
                            </div>}
                        </div>
                    )
                        : (
                            <div className={concatClassnames("p-flex", "p-flex-column", "index-helper", "toast-" + toastIndex.current)}>
                                <div className={concatClassnames("toast-header", "info")}>
                                    <div className="toast-header-left">
                                        <i className="toast-header-icon pi pi-info-circle" />
                                        <span className="toast-header-text">{translation.get("Information")}</span>
                                    </div>
                                    <button
                                        className="toast-header-close pi pi-times"
                                        onClick={event => {
                                            handleClose((event.target as HTMLElement).closest('.index-helper') as HTMLElement);
                                        }} />
                                </div>
                                <div className="toast-content">
                                    {(messageObj as ToastMessage).summary}
                                </div>
                                <div className={concatClassnames("toast-footer", "single-button")}>
                                    <Button type="button" label="OK" onClick={(event) => {
                                        handleClose((event.target as HTMLElement).closest('.index-helper') as HTMLElement);
                                    }} />
                                </div>
                            </div>
                        )

                toastInfoRef.current.show(messageObj);
                if (castedDialog && castedDialog.iconType !== undefined && castedDialog.resizable !== false) {
                    //@ts-ignore
                    const toastElem = toastInfoRef.current.container.querySelector('.toast-' + toastIndex.current).closest(".p-toast-message") as HTMLElement;
                    toastElem.style.setProperty('overflow', 'auto');
                    toastElem.style.setProperty('resize', 'both');
                    (toastElem.children[0] as HTMLElement).style.setProperty('height', 'inherit');
                    (toastElem.children[0] as HTMLElement).style.setProperty('width', 'inherit');
                    (toastElem.children[0].children[0] as HTMLElement).style.setProperty('height', 'inherit');
                    (toastElem.children[0].children[0] as HTMLElement).style.setProperty('width', 'inherit');
                }
                toastIndex.current++;
            }
        }
    }, [toastProps])

    return (
        <>
            <Toast id="toastErr" ref={toastErrRef} position="top-right" />
            <Toast id="toastInfo" ref={toastInfoRef} position="center" />
        </>
    )
}
export default UIToast