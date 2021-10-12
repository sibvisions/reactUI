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

    useEventHandler(document.body, "keydown", (event) => {
        if ((event as KeyboardEvent).key === "Escape") {
            history.push("/login");
            context.subscriptions.emitRestart();
        }
    })

    return (
        <>
            <div className="rc-glasspane" />
            <div className="rc-session-expired" tabIndex={0} onClick={() => { history.push("/login"); context.subscriptions.emitRestart()}}>
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