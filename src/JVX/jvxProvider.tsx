import React, { createContext, FC } from "react";
import Server from "./Server";
import ContentStore from "./ContentStore";


type jvxContextType={
    server: Server
    contentStore: ContentStore
}

const contentStore = new ContentStore();
const server = new Server(contentStore);
const initValue: jvxContextType = {
    contentStore: contentStore,
    server: server
}

export const jvxContext = createContext<jvxContextType>(initValue)

const JVXProvider: FC = ({children}) => {

    return (
        <jvxContext.Provider value={initValue}>
            {children}
        </jvxContext.Provider>
    )
}
export default JVXProvider


