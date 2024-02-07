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

import React, { FC, useCallback, useContext, useEffect, useRef, useState } from "react";
import { showTopBar } from "../../main/components/topbar/TopBar";
import useEventHandler from "../../main/hooks/event-hooks/useEventHandler";
import { concatClassnames } from "../../main/util/string-util/ConcatClassnames";
import { createAliveRequest } from "../../main/factories/RequestFactory";
import REQUEST_KEYWORDS from "../../main/request/REQUEST_KEYWORDS";
import { translation } from "../../main/util/other-util/Translation";
import { appContext } from "../../main/contexts/AppProvider";

/**
 * Interface for server-error messages
 */
export type IServerFailMessage = {
    headerMessage:string,
    bodyMessage:string,
    sessionExpired:boolean,
    gone:boolean,
    retry:Function|undefined,
    dontShowRestart:boolean,
    priority: number
}

/**
 * This component displays an error-message as a bar "above" the application.
 * The application is not usable behind the error because of a glass-pane
 */
const ErrorBar:FC = () => {
    /** Returns utility variables */
    const context = useContext(appContext);

    /** True, if the error-bar is visible */
    const [visible, setVisible] = useState<boolean>(false);

    /** Reference for the dialog which shows the error message */
    const [errorProps, setErrorProps] = useState<IServerFailMessage>({ headerMessage: "Server Failure", bodyMessage: "Something went wrong with the server.", sessionExpired: false, gone: false, retry: undefined, dontShowRestart: false, priority: 0 });

    /** True, if a request has already been sent, to prevent multiple requests being sent when spamming "esc" or click */
    const alreadySent = useRef<boolean>(false);

    /**
     * Sets the state of the error properties, but only if the new priority is higher than the old error priority
     * @param header - the header message of the error
     * @param body - the body message of the error
     * @param sessionExp - true, if the session has expired
     * @param priority - the priority of the error, a higher priority error gets shown instead of a smaller priority one
     * @param gone - true, if the application is gone
     * @param retry - a function (mostly a server call), to retry when pressing space or clicking the bar
     * @param dontShowRestart - true, if the retry function should never be called
     */
    const setErrorPropsState = useCallback((
        header: string,
        body: string,
        sessionExp: boolean,
        priority: number,
        gone: boolean,
        retry: Function,
        dontShowRestart: boolean
    ) => {
        if (priority >= errorProps.priority) {
            setErrorProps({
                headerMessage: header,
                bodyMessage: body,
                sessionExpired: sessionExp,
                priority: priority,
                gone: gone,
                retry: retry,
                dontShowRestart: dontShowRestart
            })
        }
    }, [errorProps.priority])

    // Subscribes to the error-bar properties of which information to show/execute
    useEffect(() => {
        context.subscriptions.subscribeToErrorBarVisible((show: boolean) => setVisible(show));
        context.subscriptions.subscribeToErrorBarProps((
            header: string,
            body: string,
            sessionExp: boolean,
            priority:number,
            gone: boolean,
            retry: Function,
            dontShowRestart: boolean
        ) => {
            setErrorPropsState(header, body, sessionExp, priority, gone, retry, dontShowRestart);
        });

        return () => {
            context.subscriptions.unsubscribeFromErrorBarVisible();
            context.subscriptions.unsubscribeFromErrorBarProps();
        }
    }, [context.subscriptions, setErrorPropsState])

    // When the errorProps change, set alreadySent to false
    useEffect(() => {
        if (alreadySent.current) {
            alreadySent.current = false;
        }
    }, [errorProps])

    // If visible changes to false, change the priority of this error to 0, so a new error can come
    useEffect(() => {
        if (!visible) {
            setErrorProps(prevState => ({...prevState, priority: 0}));
        }
    }, [visible])

    /**
     * Restarts the app when the session expires
     */
    const handleRestart = () => {
        context.server.isExiting = true;
        context.server.timeoutRequest(fetch(context.server.BASE_URL + context.server.endpointMap.get(REQUEST_KEYWORDS.EXIT), context.server.buildReqOpts(createAliveRequest())), context.server.timeoutMs);
        sessionStorage.clear();
        window.location.reload();
    }

    /**
     * Restarts the app if session-expired/gone or retries the last request which resulted in an error.
     */
    const handleRetry = () => {
        if (!alreadySent.current) {
            setVisible(false);
            if (errorProps.sessionExpired || errorProps.gone) {
                alreadySent.current = true;
                handleRestart();
            }
            else if (errorProps.retry !== undefined) {
                alreadySent.current = true;
                context.subscriptions.emitErrorBarVisible(false);
                showTopBar(errorProps.retry(), context.server.topbar);
            }
        }
    }

    /**
     * Either starts the session restart or retries the last failed request, with escape or space key
     */
    useEventHandler(errorProps.sessionExpired || errorProps.gone || errorProps.retry ? document.body : undefined, "keydown", (event) => {
        if ([" ", "Escape"].indexOf(event.key) !== -1) {
            handleRetry()
        }
    });

    /** Returns the body messages depending on whether or not a retry is available */
    const getBodyMessage = () => {
        if (errorProps.bodyMessage) {
            if (errorProps.dontShowRestart) {
                return errorProps.bodyMessage;
            }
            return errorProps.bodyMessage + ". " + translation.get("Click here! Or press Escape to retry!")
        }
        return translation.get("Click here! Or press Escape to retry!") 
    }
    
    return (
        <>
            {visible &&
                <>
                    <div className="rc-glasspane" />
                    <div className={concatClassnames("rc-error-bar", errorProps.gone ? "app-gone" : "")} tabIndex={0} onClick={() => {
                        if (errorProps.sessionExpired || errorProps.gone || errorProps.retry) {
                            handleRetry()
                        }
                    }}>
                        <div className="rc-error-bar-header">
                            <i className={concatClassnames(
                                "rc-error-bar-header-icon",
                                "pi",
                                errorProps.sessionExpired ? "pi-clock" : "pi-times-circle"
                            )} />
                            <span className="rc-error-bar-header-text">{errorProps.headerMessage}</span>
                        </div>
                        <div className="rc-error-bar-content">
                            <span dangerouslySetInnerHTML={{ __html: getBodyMessage() }} />
                        </div>
                    </div>
                </>}
        </>
    )
}
export default ErrorBar;