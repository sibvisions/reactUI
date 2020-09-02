import React, { createContext, FC } from "react";
import Server from "./Server";
import ContentStore from "./ContentStore";
import EventStream from "./EventStream";


type jvxContextType={
    server: Server,
    contentStore: ContentStore,
    eventStream: EventStream
}

const contentStore = new ContentStore();
const server = new Server(contentStore);
const eventStream = new EventStream();
const initValue: jvxContextType = {
    contentStore: contentStore,
    server: server,
    eventStream: eventStream
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


