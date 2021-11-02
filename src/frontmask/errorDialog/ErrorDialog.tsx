/** React imports */
import React, { FC, useContext } from "react";
import { useHistory } from "react-router";
import { showTopBar, TopBarContext } from "../../main/components/topbar/TopBar";
import { concatClassnames } from "../../main/components/util";
import { appContext, useEventHandler } from "../../moduleIndex";

const ErrorDialog:FC<{headerMessage:string, bodyMessage:string, sessionExpired:boolean, retry:Function}> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    const history = useHistory();

    const topbar = useContext(TopBarContext)

    const handleRestart = () => {
        history.push("/login");
        context.subscriptions.emitAppReady(false);
        context.subscriptions.emitRestart();
    }

    useEventHandler(document.body, "keydown", (event) => {
        if ([" ", "Escape"].indexOf((event as KeyboardEvent).key) !== -1) {
            if (props.sessionExpired) {
                handleRestart();
            }
            else {
                showTopBar(props.retry(), topbar);
            }
        }
    })

    return (
        <>
            <div className="rc-glasspane" />
            <div className="rc-error-dialog" tabIndex={0} onClick={ () => props.sessionExpired ? handleRestart() : showTopBar(props.retry(), topbar)}>
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