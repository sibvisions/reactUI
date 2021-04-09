/** React imports */
import React, { createContext, FC, ReactElement, useContext } from "react";
import { useParams } from "react-router";

/** Other imports */
import { getScreenIdFromNavigation } from "../JVX/components/util/GetScreenNameFromNavigation";
import { IForwardRef } from "../JVX/IForwardRef";

/** Other imports */
import { jvxContext } from "../JVX/jvxProvider";
import WorkScreen from "./workscreen/WorkScreen";

export interface IScreenContext {
    screen?: ReactElement;
}

export const ScreenContext = createContext<IScreenContext>({});

/** Displays either CustomDisplays set by the user or the workscreen */
const ScreenManager:FC<IForwardRef> = ({forwardedRef}) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);
    const { contentStore, contentStore: { customDisplays } } = context;
    /** ComponentId of Screen extracted by useParams hook */
    const {componentId} = useParams<any>();
    /** The ID of the screen based on the navigation-name */
    const screenId = getScreenIdFromNavigation(componentId, contentStore)

    const screen = <WorkScreen forwardedRef={forwardedRef} />;

    /** If there is a custom-display for this screen, check if there is a global and global should be shown, if true show global if false don't */
    if (customDisplays.has(screenId)) {
        const customDisplay = customDisplays.get(screenId)
        if (customDisplays.has('global') && customDisplay?.options.global){
            const content = <ScreenContext.Provider value={{screen}}>
                {customDisplay?.display}
            </ScreenContext.Provider>
            return <ScreenContext.Provider value={{screen: content}}>
                {customDisplays.get('global')?.display}
            </ScreenContext.Provider>
        } else { 
            return <ScreenContext.Provider value={{screen}}>
                {customDisplay?.display}
            </ScreenContext.Provider>
        }
    }
    /** If there is a custom-global-display show it, if not just show the workscreen */
    else if (customDisplays.has('global')) {
        return <ScreenContext.Provider value={{screen}}>
            {customDisplays.get('global')?.display}
        </ScreenContext.Provider>
    } else {
        return screen
    }
}
export default ScreenManager