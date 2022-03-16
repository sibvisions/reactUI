import React, { createContext, FC, useState } from "react";
import { useHistory } from "react-router";
import Server from "./Server";
import ContentStore from "./ContentStore";
import { SubscriptionManager } from "./SubscriptionManager";
import API from "./API";
import AppSettings from "./AppSettings";

/** Type for AppContext */
export type AppContextType={
    server: Server,
    contentStore: ContentStore,
    subscriptions: SubscriptionManager,
    api: API,
    appSettings: AppSettings,
    ctrlPressed: boolean,
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
const api = new API(server, contentStore, appSettings, subscriptions);


contentStore.setSubscriptionManager(subscriptions);
server.setAPI(api);
/** Initial value for state */
const initValue: AppContextType = {
    contentStore: contentStore,
    server: server,
    api: api,
    appSettings: appSettings,
    subscriptions: subscriptions,
    ctrlPressed: false,
}

/** Context containing the server and contentstore */
export const appContext = createContext<AppContextType>(initValue)

/**
 * This component provides the appContext to its children
 * @param children - the children
 */
const AppProvider: FC = ({children}) => {
    /** History of react-router-dom */
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


