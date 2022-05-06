import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputTextarea } from "primereact/inputtextarea";
import { ListBox } from "primereact/listbox"
import React, { CSSProperties, FC, useCallback, useEffect, useMemo, useState } from "react";
import tinycolor from "tinycolor2";
import { ErrorResponse } from "../../main/response";
import { concatClassnames } from "../../main/util";
import { useConstants } from "../../moduleIndex";

/** Displays an errr-message as dialog */
const ErrorDialog:FC = () => {
    /** Returns utility variables */
    const [context,, translations] = useConstants();

    /** True, if the error-dialog is visible */
    const [visible, setVisible] = useState<boolean>(false);

    /** State of the error-properties */
    const [errorProps, setErrorProps] = useState<ErrorResponse>();

    /** True, if the error-details should be displayed */
    const [showDetails, setShowDetails] = useState<boolean>(false);

    /** The button background based on the color-scheme */
    const btnBgd = window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color');

    /** The currently selected error when details is expanded */
    const [selectedError, setSelectedError] = useState<{label: string, details: string} | null>(null)

    const errorItems = useMemo(() => {
        if (errorProps && errorProps.message && errorProps.details) {
            return [{
                label: translations.get("Cause(s) of failure") as string,
                items: [{ label: errorProps.message, details: errorProps.details}]
            }];
        }
        return[ { 
            label: translations.get("Cause(s) of failure") as string, 
            items: [] 
        }]
    }, [errorProps]);

    useEffect(() => {
        context.subscriptions.subscribeToErrorDialogProps((errData:ErrorResponse) => setErrorProps(errData));

        return () => context.subscriptions.unsubscribeFromErrorDialogProps();
    }, [context.subscriptions]);

    useEffect(() => {
        if (errorProps) {
            setVisible(true);
        }
    }, [errorProps]);

    const handleOnHide = () => setVisible(false)

    const errorFooter = useCallback(() => {
        return (
            <>
                <div>
                    <Button
                        type="button"
                        className="rc-button"
                        style={{
                            '--background': btnBgd,
                            '--hoverBackground': tinycolor(btnBgd).darken(5).toString()
                        } as CSSProperties}
                        label={translations.get("Details")}
                        onClick={() => {
                            setSelectedError(errorItems.length ? errorItems[0].items[0] : null);
                            setShowDetails(prevState => !prevState)
                        }} />
                    <Button
                        type="button"
                        className="rc-button"
                        style={{
                            '--background': btnBgd,
                            '--hoverBackground': tinycolor(btnBgd).darken(5).toString()
                        } as CSSProperties}
                        label={translations.get("OK")}
                        onClick={() => handleOnHide()} />
                </div>
                {showDetails &&
                    <>
                        <div
                            className="rc-panel-group-caption error-dialog-details-caption"
                            style={{ marginTop: "1rem", textAlign: "left" }}>
                            <span>Details</span>
                        </div>
                        <ListBox 
                            className="error-dialog-listbox" 
                            value={selectedError} 
                            optionGroupLabel="label" 
                            optionGroupChildren="items" 
                            optionLabel="label" 
                            options={errorItems} 
                            onChange={(e) => {
                                if (e.value !== null) {
                                    setSelectedError(e.value)
                                }
                            }} />
                        <InputTextarea
                            className={concatClassnames("rc-input", "error-dialog-textarea")}
                            value={selectedError?.details}
                            style={{ resize: 'none' }}
                            readOnly />
                    </>
                }
            </>
        )
    }, [showDetails, selectedError, errorProps])

    return (
        <Dialog className="error-dialog" header={errorProps?.title} footer={errorFooter} visible={visible} onHide={handleOnHide} baseZIndex={1005}>
            <i className="error-dialog-icon pi pi-times-circle" />
            {errorProps?.message}
        </Dialog>
    )
}
export default ErrorDialog;