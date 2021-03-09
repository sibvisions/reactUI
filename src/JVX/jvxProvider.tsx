/** React imports */
import React, {createContext, FC, useState} from "react";

/** Other imports */
import Server from "./Server";
import ContentStore from "./ContentStore";
import { SubscriptionManager } from "./SubscriptionManager";

/** Type for jvxContext */
type jvxContextType={
    server: Server,
    contentStore: ContentStore,
    subscriptions: SubscriptionManager,
    //theme: string,
    //setTheme: Function
}

/** Contentstore instance */
const contentStore = new ContentStore();
/** subscriptionManager instance */
const subscriptions = new SubscriptionManager(contentStore)
/** Server instance */
const server = new Server(contentStore, subscriptions);

contentStore.setsubscriptionManager(subscriptions);
/** Initial value for state */
const initValue: jvxContextType = {
    contentStore: contentStore,
    server: server,
    subscriptions: subscriptions
    //theme: "",
    //setTheme: () => {},
}

/** Context containing the server and contentstore */
export const jvxContext = createContext<jvxContextType>(initValue)

/**
 * This component provides the jvxContext to its children
 * @param param0 - the children
 */
const JVXProvider: FC = ({children}) => {

    /** Sets the initial state */
    const initState = (): jvxContextType => {
        // const setTheme = (newTheme: string) => {
        //     setContextState({...contextState, theme: newTheme});
        // }

        const contentStore = new ContentStore();
        const subscriptions = new SubscriptionManager(contentStore)
        const server = new Server(contentStore, subscriptions);
        
        contentStore.setsubscriptionManager(subscriptions)

        return {
            //theme: "dark",
            //setTheme: setTheme,
            contentStore: contentStore,
            server: server,
            subscriptions: subscriptions
        }

    }

    /** Current State of the context */
    const [contextState, setContextState] = useState<jvxContextType>(initState())




    return (
        <jvxContext.Provider value={contextState}>
            {children}
        </jvxContext.Provider>
    )
}
export default JVXProvider


