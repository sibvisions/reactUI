/** React imports */
import React, { FC, useRef } from "react";

/** 3rd Party imports */
import { useHistory } from "react-router";

/** Other imports */
import { IServerFailMessage } from "../../AppWrapper";
import { showTopBar } from "../../main/components/topbar/TopBar";
import { concatClassnames } from "../../main/components/util";
import { useConstants, useEventHandler } from "../../moduleIndex";

/**
 * This component displays an error-message
 * @param props - contains the error message and if the session is expired or server error
 */
const ErrorDialog:FC<IServerFailMessage> = (props) => {
    /** Returns utility variables */
    const [context, topbar] = useConstants();

    /** History of react-router-dom */
    const history = useHistory();

    const alreadySent = useRef<boolean>(false);

    /**
     * Restarts the app when the session expires
     */
    const handleRestart = () => {
        //history.push("/login");
        context.appSettings.setAppReadyParamFalse();
        context.subscriptions.emitAppReady(false);
        context.subscriptions.emitRestart();
    }

    /**
     * Restarts the app if session-expired or retries the last request which resulted in an error.
     */
    const handleRetry = () => {
        if (!alreadySent.current) {
            if (props.sessionExpired || props.gone) {
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
     * Either starts the session restart or retries the last failed request
     */
    useEventHandler(props.sessionExpired ||props.gone || props.retry ? document.body : undefined, "keydown", (event) => {
        if ([" ", "Escape"].indexOf((event as KeyboardEvent).key) !== -1) {
            handleRestart()
        }
    });
    
    return (
        <>
            <div className="rc-glasspane" />
            <div className={concatClassnames("rc-error-dialog", props.gone ? "app-gone" : "")} tabIndex={0} onClick={() => {
                if (props.sessionExpired || props.gone || props.retry) {
                    handleRetry()
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