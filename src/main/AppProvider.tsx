/** React imports */
import React, { createContext, FC, useState } from "react";

/** 3rd Party imports */
import { useHistory } from "react-router";

/** Other imports */
import Server from "./Server";
import ContentStore from "./ContentStore";
import { SubscriptionManager } from "./SubscriptionManager";
import { ToastMessageType } from "primereact/toast";
import API from "./API";
import AppSettings from "./AppSettings";

/** Type for AppContext */
type AppContextType={
    server: Server,
    contentStore: ContentStore,
    subscriptions: SubscriptionManager,
    api: API,
    appSettings: AppSettings,
    ctrlPressed: boolean,
    showToast:Function
    //theme: string,
    //setTheme: Function
}

/** Contentstore instance */
const contentStore = new ContentStore();
/** SubscriptionManager instance */
const subscriptions = new SubscriptionManager(contentStore)
/** AppSettings instance */
const appSettings = new AppSettings(contentStore, subscriptions);
/** Server instance */
const server = new Server(contentStore, subscriptions, appSettings);
/** API instance */
const api = new API(server, contentStore, appSettings);


contentStore.setSubscriptionManager(subscriptions);
/** Initial value for state */
const initValue: AppContextType = {
    contentStore: contentStore,
    server: server,
    api: api,
    appSettings: appSettings,
    subscriptions: subscriptions,
    ctrlPressed: false,
    showToast: (message: ToastMessageType, err: boolean) => {}
    //theme: "",
    //setTheme: () => {},
}

/** Context containing the server and contentstore */
export const appContext = createContext<AppContextType>(initValue)

/**
 * This component provides the appContext to its children
 * @param children - the children
 */
const AppProvider: FC = ({children}) => {
    const history = useHistory()

    /** Sets the initial state */
    const initState = (): AppContextType => {
        initValue.contentStore.history = history;
        initValue.api.history = history;
        initValue.server.history = history;
        return {
            ...initValue,
        }
    }

    /** Current State of the context */
    const [contextState, setContextState] = useState<AppContextType>(initState())

    return (
        <appContext.Provider value={contextState}>
            {children}
        </appContext.Provider>
    )
}
export default AppProvider


