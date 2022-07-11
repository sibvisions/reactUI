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

import React, { FC, useEffect, useRef, useState } from "react";
import { useHistory } from "react-router";
import { showTopBar } from "../../main/components/topbar/TopBar";
import useConstants from "../../main/hooks/components-hooks/useConstants";
import useEventHandler from "../../main/hooks/event-hooks/useEventHandler";
import { concatClassnames } from "../../main/util/string-util/ConcatClassnames";

/**
 * Interface for server-error messages
 */
export type IServerFailMessage = {
    headerMessage:string,
    bodyMessage:string,
    sessionExpired:boolean,
    gone:boolean
    retry:Function
}

/**
 * This component displays an error-message as a bar "above" the application.
 * The application is not usable behind the error because of a glass-pane
 */
const ErrorBar:FC = () => {
    /** Returns utility variables */
    const [context, topbar] = useConstants();

    /** True, if the error-bar is visible */
    const [visible, setVisible] = useState<boolean>(false);

    /** Reference for the dialog which shows the timeout error message */
    const [errorProps, setErrorProps] = useState<IServerFailMessage>({ headerMessage: "Server Failure", bodyMessage: "Something went wrong with the server.", sessionExpired: false, gone: false, retry: () => {} });

    /** History of react-router-dom */
    const history = useHistory();

    /** True, if a request has already been sent, to prevent multiple requests being sent when spamming "esc" or click */
    const alreadySent = useRef<boolean>(false);

    // Subscribes to the error-bar visibility and the properties of which information to show/execute
    useEffect(() => {
        context.subscriptions.subscribeToErrorBarVisible((show: boolean) => setVisible(show));
        context.subscriptions.subscribeToErrorBarProps((
            header: string,
            body: string,
            sessionExp: boolean,
            gone: boolean,
            retry: Function
        ) => setErrorProps({
            headerMessage: header,
            bodyMessage: body,
            sessionExpired: sessionExp,
            gone: gone,
            retry: retry
        }));

        return () => {
            context.subscriptions.unsubscribeFromErrorBarVisible();
            context.subscriptions.unsubscribeFromErrorBarProps();
        }
    }, [context.subscriptions])

    // When the errorProps change, set alreadySent to false
    useEffect(() => {
        if (alreadySent.current) {
            alreadySent.current = false;
        }
    }, [errorProps])

    /**
     * Restarts the app when the session expires
     */
    const handleRestart = () => {
        if (context.transferType !== "full") {
            history.push("/login");
        }
        context.appSettings.setAppReadyParamFalse();
        context.subscriptions.emitAppReady(false);
        context.subscriptions.emitRestart();
    }

    /**
     * Restarts the app if session-expired or retries the last request which resulted in an error.
     */
    const handleRetry = () => {
        if (!alreadySent.current) {
            setVisible(false);
            if (errorProps.sessionExpired || errorProps.gone) {
                alreadySent.current = true;
                handleRestart();
            }
            else {
                alreadySent.current = true;
                context.subscriptions.emitErrorBarVisible(false);
                showTopBar(errorProps.retry(), topbar);
            }
        }
    }

    /**
     * Either starts the session restart or retries the last failed request
     */
    useEventHandler(errorProps.sessionExpired || errorProps.gone || errorProps.retry ? document.body : undefined, "keydown", (event) => {
        if ([" ", "Escape"].indexOf((event as KeyboardEvent).key) !== -1) {
            handleRetry()
        }
    });
    
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
                            <span dangerouslySetInnerHTML={{ __html: errorProps.bodyMessage ? errorProps.bodyMessage + ". <u>Click here!</u> or press Escape to retry!" : "<u>Click here!</u> or press Escape to retry!" }} />
                        </div>
                    </div>
                </>}
        </>
    )
}
export default ErrorBar;