/** React imports */
import React, { FC, useContext } from "react";
import { useHistory } from "react-router";
import { concatClassnames } from "../../main/components/util";
import { appContext, useEventHandler } from "../../moduleIndex";

const ErrorDialog:FC<{headerMessage:string, bodyMessage:string, sessionExpired:boolean}> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    const history = useHistory();

    const handleRestart = () => {
        history.push("/login");
        context.subscriptions.emitAppReady(false);
        context.subscriptions.emitRestart();
    }

    useEventHandler(document.body, "keydown", (event) => {
        if ([" ", "Escape"].indexOf((event as KeyboardEvent).key) !== -1) {
            handleRestart();
        }
    })

    return (
        <>
            <div className="rc-glasspane" />
            <div className="rc-error-dialog" tabIndex={0} onClick={handleRestart}>
                <div className="rc-error-dialog-header">
                    <i className={concatClassnames(
                        "rc-error-dialog-header-icon",
                        "pi",
                        props.sessionExpired ? "pi-clock" : "pi-times-circle"
                    )}/>
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