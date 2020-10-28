import React, {createContext, FC, useState} from "react";
import Server from "./Server";
import ContentStore from "./ContentStore";


type jvxContextType={
    server: Server,
    contentStore: ContentStore,
    theme: string,
    setTheme: Function
}

const contentStore = new ContentStore();
const server = new Server(contentStore);
const initValue: jvxContextType = {
    contentStore: contentStore,
    server: server,
    theme: "",
    setTheme: () => {},
}

export const jvxContext = createContext<jvxContextType>(initValue)

const JVXProvider: FC = ({children}) => {

    const initState = (): jvxContextType => {
        const setTheme = (newTheme: string) => {
            setContextState({...contextState, theme: newTheme});
        }

        const contentStore = new ContentStore();
        const server = new Server(contentStore);

        return {
            theme: "dark",
            setTheme: setTheme,
            contentStore: contentStore,
            server: server
        }

    }

    const [contextState, setContextState] = useState<jvxContextType>(initState())




    return (
        <jvxContext.Provider value={contextState}>
            {children}
        </jvxContext.Provider>
    )
}
export default JVXProvider


