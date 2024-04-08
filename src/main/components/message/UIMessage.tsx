/* Copyright 2023 SIB Visions GmbH
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

import { ConfirmDialog, ConfirmDialogProps } from 'primereact/confirmdialog';
import React, { CSSProperties, FC, useCallback, useContext, useMemo, useState } from 'react';
import DialogResponse from '../../response/ui/DialogResponse';
import { translation } from '../../util/other-util/Translation';
import { Button } from 'primereact/button';
import tinycolor from 'tinycolor2';
import { showTopBar } from '../topbar/TopBar';
import { appContext } from '../../contexts/AppProvider';
import { createCloseFrameRequest, createDispatchActionRequest } from '../../factories/RequestFactory';
import REQUEST_KEYWORDS from '../../request/REQUEST_KEYWORDS';
import { concatClassnames } from '../../util/string-util/ConcatClassnames';
import { InputText } from 'primereact/inputtext';

const UIMessage: FC<DialogResponse> = (props) => {
    /** Returns utility variables */
    const context = useContext(appContext);

    /** The properties ConfirmDialog */
    const [confirmProps, setConfirmProps] = useState<ConfirmDialogProps>({});

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

    const headerContent = useCallback((iconType: 0 | 1 | 2 | 3 | 9 | -1): { icon: string, text: string } => {
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
    }, [translation]);

    /**
     * Builds the footer content based on the button type
     * @param buttonType - the button type
     * @param okCompId - the component id of the ok button
     * @param cancelCompId - the component id of the cancel button
     * @param notOkCompId - the component id of the not ok button
     */
    const footerContent = useCallback((buttonType: 4 | 5 | 6 | 7 | 8 | -1, okCompId?: string, cancelCompId?: string, notOkCompId?: string) => {
        const sendPressButton = (compId?: string) => {
            if (compId) {
                const pressBtnReq = createDispatchActionRequest();
                pressBtnReq.componentId = compId;
                showTopBar(context.server.sendRequest(pressBtnReq, REQUEST_KEYWORDS.PRESS_BUTTON), context.server.topbar);
            }
        }

        // Returns the button background of the current color scheme
        const getButtonBackground = (): string => {
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
                        label={props.cancelText || (buttonType === 4 ? translation.get("Cancel") : translation.get("No"))}
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
                        label={props.okText || (buttonType === 4 ? translation.get("OK") : translation.get("Yes"))}
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
                    label={props.okText || translation.get("OK")}
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
                            label={props.cancelText || translation.get("Cancel")}
                            onClick={() => {
                                sendPressButton(cancelCompId);
                            }} />
                        <Button
                            type="button"
                            className="rc-button"
                            label={props.notOkText || translation.get("No")}
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
                        label={props.okText || translation.get("Yes")}
                        onClick={() => {
                            sendPressButton(okCompId);
                        }} />
                </>
            )
        }
        else {
            return <></>
        }
    }, [translation, props.okText, props.notOkText, props.cancelText, context.server.topbar]);

    const dialogHeader = useMemo(() => {
        return (<>
            {props.iconType !== 9 && props.iconType !== -1 &&
                <div className={concatClassnames("message-dialog-header", getHeaderType(props.iconType))}>
                    <div className="message-dialog-header-left">
                        <i className={concatClassnames("message-dialog-header-icon", headerContent(props.iconType).icon)} />
                        <span className="message-dialog-header-text">{headerContent(props.iconType).text}</span>
                    </div>
                </div>
            }
        </>)
    }, [props.iconType, headerContent]);


    const dialogMessage = useMemo(() => {
        return (
            <>
                <div className="message-dialog-content">
                    {props.message?.startsWith("<html>") ? <span dangerouslySetInnerHTML={{ __html: props.message as string }} /> : <>{props.message}</>}
                </div>
                {props.dataProvider !== undefined &&
                <div className="message-dialog-input">
                    <InputText type="text"
                               id="input"
                               placeholder="{props.inputLabel}" 
                               size={3}/>
                </div>
                }
            </>
        )
    }, [props.message])


    const dialogFooter = useMemo(() => {
        return (<>
            {props.buttonType !== 8 && props.buttonType !== -1 &&
                <div className={concatClassnames("message-dialog-footer", props.buttonType === 6 ? "single-button" : "more-buttons")}>
                    {footerContent(props.buttonType, props.okComponentId, props.cancelComponentId, props.notOkComponentId)}
                </div>
            }
        </>)
    }, [props.buttonType, props.okComponentId, props.cancelComponentId, props.notOkComponentId, footerContent]);

    const handleOnHide = () => {
        const closeFrameReq = createCloseFrameRequest();
        closeFrameReq.componentId = props.componentId;
        showTopBar(context.server.sendRequest(closeFrameReq, REQUEST_KEYWORDS.CLOSE_FRAME), context.server.topbar);
    }

    return <ConfirmDialog
        visible={true}
        header={dialogHeader}
        message={dialogMessage}
        footer={dialogFooter}
        onHide={handleOnHide}
        resizable={props.resizable}
        closable={props.closable}
        className={concatClassnames(
            "rc-message-dialog",
            getHeaderType(props.iconType),
            props.buttonType === 8 || props.buttonType === -1 ? "message-dialog-no-footer" : ""
        )} />
}
export default UIMessage;