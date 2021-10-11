/** React imports */
import React, { FC, useContext, useEffect, useLayoutEffect, useRef, useState } from "react"

/** 3rd Party imports */
import { Dialog } from 'primereact/dialog';
import { Helmet } from "react-helmet";

/** Other imports */
import TopBar from "./main/components/topbar/TopBar";
import UIToast from './main/components/toast/UIToast';
import { appContext, useConfirmDialogProps } from "./moduleIndex";
import { ConfirmDialog } from "primereact/confirmdialog";
import { PopupContextProvider } from "./main/components/zhooks/usePopupMenu";

type ServerFailMessage = {
    headerMessage:string,
    bodyMessage:string
}

type IAppWrapper = {
    appName?:string
}

const AppWrapper:FC<IAppWrapper> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** State if timeout error should be shown */
    const [dialogVisible, setDialogVisible] = useState<boolean>(false);

    const [messageVisible, messageProps] = useConfirmDialogProps();

    /** Reference for the dialog which shows the timeout error message */
    const dialogRef = useRef<ServerFailMessage>({ headerMessage: "Server Failure", bodyMessage: "Something went wrong with the server." });

    useLayoutEffect(() => {
        const link:HTMLLinkElement = document.createElement('link'); 
        link.rel = 'stylesheet'; 
        link.type = 'text/css';
        link.href = 'application.css';
        document.getElementsByTagName('HEAD')[0].appendChild(link);
    }, [])

    /**
     * Subscribes to session-expired notification and app-ready
     * @returns unsubscribes from session and app-ready
     */
     useEffect(() => {
        context.subscriptions.subscribeToDialog("server", (header:string, body:string) => {
            dialogRef.current.headerMessage = header;
            dialogRef.current.bodyMessage = body;
            setDialogVisible(true);
        });

        return () => {
            context.subscriptions.unsubscribeFromDialog("server");
        }
    },[context.subscriptions]);

    return (
        <>
            <Helmet>
                <title>{props.appName ? props.appName : "<App-Name>"}</title>
            </Helmet>
            <UIToast />
            <ConfirmDialog visible={messageVisible} {...messageProps} />
            <Dialog header="Server Error!" visible={dialogVisible} closable={false} onHide={() => setDialogVisible(false)} resizable={false} draggable={false}>
                <p>{dialogRef.current.bodyMessage.toString()}</p>
            </Dialog>
            <PopupContextProvider>
                <TopBar>
                    {props.children}
                </TopBar>
            </PopupContextProvider>
        </>
    )
}
export default AppWrapper