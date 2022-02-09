/** React imports */
import React, { FC, useContext, useEffect, useLayoutEffect, useState } from "react"

/** 3rd Party imports */
import { Helmet } from "react-helmet";

/** Other imports */
import TopBar from "./main/components/topbar/TopBar";
import UIToast from './main/components/toast/UIToast';
import { appContext, useConfirmDialogProps } from "./moduleIndex";
import { ConfirmDialog } from "primereact/confirmdialog";
import { PopupContextProvider } from "./main/components/zhooks/usePopupMenu";
import ErrorDialog from "./frontmask/errorDialog/ErrorDialog";
import { addCSSDynamically } from "./main/components/util";

export type IServerFailMessage = {
    headerMessage:string,
    bodyMessage:string,
    sessionExpired:boolean,
    retry:Function
}

interface IAppWrapper {
    embedOptions?: { [key:string]:any }
}

const AppWrapper:FC<IAppWrapper> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    const [dialogVisible, setDialogVisible] = useState<boolean>(false);

    const [messageVisible, messageProps] = useConfirmDialogProps();

    const [appName, setAppName] = useState<string>(context.appSettings.applicationMetaData.applicationName);

    /** Reference for the dialog which shows the timeout error message */
    const [errorProps, setErrorProps] = useState<IServerFailMessage>({ headerMessage: "Server Failure", bodyMessage: "Something went wrong with the server.", sessionExpired: false, retry: () => {} });

    const [cssVersion, setCssVersion] = useState<string>("");

    /** Flag to retrigger Startup if session expires */
    const [restart, setRestart] = useState<boolean>(false);

    useLayoutEffect(() => {
        let path = 'application.css'
        if (cssVersion) {
            path = path + "?version=" + cssVersion;
        }
        addCSSDynamically(path, "appCSS", context.appSettings)
    }, [cssVersion, restart]);

    /**
     * Subscribes to session-expired notification and app-ready
     * @returns unsubscribes from session and app-ready
     */
     useEffect(() => {
        context.subscriptions.subscribeToDialog("server", (header:string, body:string, sessionExp:boolean, retry:Function) => setErrorProps({ headerMessage: header, bodyMessage: body, sessionExpired: sessionExp, retry: retry }));

        context.subscriptions.subscribeToErrorDialog((show:boolean) => setDialogVisible(show));

        context.subscriptions.subscribeToAppName((newAppName:string) => setAppName(newAppName));

        context.subscriptions.subscribeToCssVersion((version:string) => setCssVersion(version));

        context.subscriptions.subscribeToRestart(() => setRestart(prevState => !prevState))

        return () => {
            context.subscriptions.unsubscribeFromDialog("server");
            context.subscriptions.unsubscribeFromErrorDialog((show:boolean) => setDialogVisible(show));
            context.subscriptions.unsubscribeFromAppName((newAppName:string) => setAppName(newAppName));
            context.subscriptions.unsubscribeFromCssVersion();
            context.subscriptions.unsubscribeFromRestart(() => setRestart(prevState => !prevState));
        }
    },[context.subscriptions]);

    return (
        <>
            <Helmet>
                <title>{appName ? appName : "<App-Name>"}</title>
            </Helmet>
            <UIToast />
            <ConfirmDialog visible={messageVisible} {...messageProps} />
            {dialogVisible && <ErrorDialog headerMessage={errorProps.headerMessage} bodyMessage={errorProps.bodyMessage} sessionExpired={errorProps.sessionExpired} retry={errorProps.retry} />}
            <PopupContextProvider>
                <TopBar>
                    {props.children}
                </TopBar>
            </PopupContextProvider>
        </>
    )
}
export default AppWrapper