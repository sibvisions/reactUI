import { Dialog } from "primereact/dialog";
import React, { FC, useContext, useEffect, useState } from "react";
import { ErrorResponse } from "../../main/response";
import { appContext } from "../../moduleIndex";

/** Displays an errr-message as dialog */
const ErrorDialog:FC = () => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** True, if the error-dialog is visible */
    const [visible, setVisible] = useState<boolean>(false);

    const [errorProps, setErrorProps] = useState<ErrorResponse>();

    useEffect(() => {
        context.subscriptions.subscribeToErrorDialogProps((errData:ErrorResponse) => setErrorProps(errData));

        return () => context.subscriptions.unsubscribeFromErrorDialogProps();
    }, [context.subscriptions])

    useEffect(() => {
        if (errorProps) {
            setVisible(true);
        }
    }, [errorProps])

    return (
        <Dialog className="rc-popup error-dialog" header={errorProps?.title} visible={visible} onHide={() => setVisible(false)} baseZIndex={1005}>
            {errorProps?.message}
        </Dialog>
    )
}
export default ErrorDialog;