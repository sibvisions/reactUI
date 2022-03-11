/** React imports */
import React, { FC, useContext, useEffect, useLayoutEffect, useRef, useState } from "react"

/** 3rd Party imports */
import { Helmet } from "react-helmet";

/** Other imports */
import TopBar, { showTopBar, TopBarContext } from "./main/components/topbar/TopBar";
import UIToast from './main/components/toast/UIToast';
import { appContext, createOpenScreenRequest, IPanel, REQUEST_ENDPOINTS, useConfirmDialogProps } from "./moduleIndex";
import { ConfirmDialog } from "primereact/confirmdialog";
import { PopupContextProvider } from "./main/components/zhooks/usePopupMenu";
import ErrorDialog from "./frontmask/errorDialog/ErrorDialog";
import { addCSSDynamically } from "./main/components/util";
import { useHistory } from "react-router-dom";
import COMPONENT_CLASSNAMES from "./main/components/COMPONENT_CLASSNAMES";

export type IServerFailMessage = {
    headerMessage:string,
    bodyMessage:string,
    sessionExpired:boolean,
    gone:boolean
    retry:Function
}

interface IAppWrapper {
    embedOptions?: { [key:string]:any }
    theme?:string
    colorScheme?:string
    design?:string
}

const AppWrapper:FC<IAppWrapper> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    const [dialogVisible, setDialogVisible] = useState<boolean>(false);

    const [messageVisible, messageProps] = useConfirmDialogProps();

    const [appName, setAppName] = useState<string>(context.appSettings.applicationMetaData.applicationName);

    /** Reference for the dialog which shows the timeout error message */
    const [errorProps, setErrorProps] = useState<IServerFailMessage>({ headerMessage: "Server Failure", bodyMessage: "Something went wrong with the server.", sessionExpired: false, gone: false, retry: () => {} });

    const [cssVersion, setCssVersion] = useState<string>("");

    /** Flag to retrigger Startup if session expires */
    const [restart, setRestart] = useState<boolean>(false);

    const [ locationKeys, setLocationKeys ] = useState<any[]>([])

    const topbar = useContext(TopBarContext);

    /** History of react-router-dom */
    const history = useHistory();

    /** True if a screen was opened by clicking browser back or forward button (prevents openscreen loop) */
    const openedWithHistory = useRef<boolean>(false);

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
        context.subscriptions.subscribeToDialog("server", (header: string,
            body: string,
            sessionExp: boolean,
            gone: boolean,
            retry: Function
        ) => setErrorProps({
            headerMessage: header,
            bodyMessage: body,
            sessionExpired: sessionExp,
            gone: gone,
            retry: retry
        }));

        context.subscriptions.subscribeToErrorDialog((show: boolean) => setDialogVisible(show));

        context.subscriptions.subscribeToAppName((newAppName: string) => setAppName(newAppName));

        context.subscriptions.subscribeToCssVersion((version: string) => setCssVersion(version));

        context.subscriptions.subscribeToRestart(() => setRestart(prevState => !prevState))

        return () => {
            context.subscriptions.unsubscribeFromDialog("server");
            context.subscriptions.unsubscribeFromErrorDialog((show: boolean) => setDialogVisible(show));
            context.subscriptions.unsubscribeFromAppName((newAppName: string) => setAppName(newAppName));
            context.subscriptions.unsubscribeFromCssVersion();
            context.subscriptions.unsubscribeFromRestart(() => setRestart(prevState => !prevState));
        }
    }, [context.subscriptions]);

    useEffect(() => {
        history.listen(() => {
            if (history.action === "POP") {
                let currentlyOpening = false;
                if (!openedWithHistory.current) {
                    const pathName = history.location.pathname;
                    const navName = pathName.substring(pathName.indexOf("/home/") + "/home/".length);
                    if (navName) {
                        const openReq = createOpenScreenRequest();
                        openReq.componentId = context.contentStore.navOpenScreenMap.get(navName)

                        context.server.lastOpenedScreen = context.contentStore.navOpenScreenMap.get(navName) as string;

                        showTopBar(context.server.sendRequest(openReq, REQUEST_ENDPOINTS.OPEN_SCREEN), topbar);

                        currentlyOpening = true;
                        openedWithHistory.current = true;
                    }
                    else {
                        if (context.contentStore.activeScreens.length) {
                            context.contentStore.activeScreens.forEach(active => {
                                const comp = context.contentStore.getComponentByName(active.name) as IPanel;
                                if (comp && comp.className === COMPONENT_CLASSNAMES.PANEL) {
                                    context.contentStore.closeScreen(comp.name, undefined, comp.screen_modal_ === true);
                                }
                                
                            })
                            
                        }
                    }
                }

                if (!currentlyOpening) {
                    openedWithHistory.current = false;
                }
            }
        });
      }, []);

    return (
        <>
            <Helmet>
                <title>{appName ? appName : "<App-Name>"}</title>
            </Helmet>
            <UIToast />
            <ConfirmDialog visible={messageVisible} {...messageProps} />
            {dialogVisible && <ErrorDialog headerMessage={errorProps.headerMessage} bodyMessage={errorProps.bodyMessage} sessionExpired={errorProps.sessionExpired} gone={errorProps.gone} retry={errorProps.retry} />}
            <PopupContextProvider>
                <TopBar>
                    {props.children}
                </TopBar>
            </PopupContextProvider>
        </>
    )
}
export default AppWrapper