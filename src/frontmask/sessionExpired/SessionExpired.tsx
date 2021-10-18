/** React imports */
import React, { FC, useContext } from "react";
import { useHistory } from "react-router";
import { appContext, useEventHandler, useTranslation } from "../../moduleIndex";

const SessionExpired:FC = () => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    const history = useHistory();

    /** The translation */
    const translation = useTranslation();

    const handleRestart = () => {
        history.push("/login");
        context.subscriptions.emitAppReady(false);
        context.subscriptions.emitRestart();
    }

    useEventHandler(document.body, "keydown", (event) => {
        if ( [" ", "Escape"].indexOf((event as KeyboardEvent).key) !== -1) {
            handleRestart()
        }
    })

    return (
        <>
            <div className="rc-glasspane" />
            <div className="rc-session-expired" tabIndex={0} onClick={handleRestart}>
                <div className="rc-session-expired-header">
                    <i className="rc-session-expired-header-icon pi pi-clock"/>
                    <span className="rc-session-expired-header-text">{translation.get("Session expired!")}</span>
                </div>
                <div className="rc-session-expired-content">
                    <span dangerouslySetInnerHTML={{ __html: translation.get("Take note of any unsaved data, and <u>click here</u> or press ESC to continue.") as string }} />
                </div>
            </div>
        </>
    )

}
export default SessionExpired;