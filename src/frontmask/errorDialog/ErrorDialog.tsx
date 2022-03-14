import React, { FC, useRef } from "react";
import { useHistory } from "react-router";
import { IServerFailMessage } from "../../AppWrapper";
import { showTopBar } from "../../main/components/topbar/TopBar";
import { concatClassnames } from "../../main/components/util";
import { useConstants, useEventHandler } from "../../moduleIndex";

/**
 * This component displays an error-message as a bar "above" the application.
 * The application is not usable behind the error because of a glass-pane
 * @param props - contains the error message and if the session is expired or server error
 */
const ErrorDialog:FC<IServerFailMessage> = (props) => {
    /** Returns utility variables */
    const [context, topbar] = useConstants();

    /** History of react-router-dom */
    const history = useHistory();

    /** True, if a request has already been sent, to prevent multiple requests being sent when spamming "esc" or click */
    const alreadySent = useRef<boolean>(false);

    /**
     * Restarts the app when the session expires
     */
    const handleRestart = () => {
        history.push("/login");
        context.appSettings.setAppReadyParamFalse();
        context.subscriptions.emitAppReady(false);
        context.subscriptions.emitRestart();
    }

    /**
     * Restarts the app if session-expired or retries the last request which resulted in an error.
     */
    const handleRetry = () => {
        if (!alreadySent.current) {
            if (props.sessionExpired) {
                alreadySent.current = true;
                handleRestart();
            }
            else {
                alreadySent.current = true;
                showTopBar(props.retry(), topbar);
            }
        }
    }

    /**
     * Either starts the session restart or retries the last failed request, when pressing "esc" or "space"
     */
    useEventHandler(props.sessionExpired || props.retry ? document.body : undefined, "keydown", (event) => {
        if ([" ", "Escape"].indexOf((event as KeyboardEvent).key) !== -1) {
            handleRetry();
        }
    });

    return (
        <>
            <div className="rc-glasspane" />
            <div className="rc-error-dialog" tabIndex={0} onClick={() => {
                if (props.sessionExpired || props.retry) {
                    handleRetry();
                }
            }}>
                <div className="rc-error-dialog-header">
                    <i className={concatClassnames(
                        "rc-error-dialog-header-icon",
                        "pi",
                        props.sessionExpired ? "pi-clock" : "pi-times-circle"
                    )} />
                    <span className="rc-error-dialog-header-text">{props.headerMessage}</span>
                </div>
                <div className="rc-error-dialog-content">
                    <span dangerouslySetInnerHTML={{ __html: props.bodyMessage }} />
                </div>
            </div>
        </>
    )

}
export default ErrorDialog;